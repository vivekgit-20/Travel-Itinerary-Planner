"""
PDF service — generates a professional travel guide PDF using ReportLab.

Uses run_in_executor to avoid blocking the FastAPI async event loop.
"""

from __future__ import annotations

import asyncio
import io
from datetime import date
from concurrent.futures import ThreadPoolExecutor

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.schemas.trip import TripResponse


_executor = ThreadPoolExecutor(max_workers=2)

TEAL = colors.HexColor("#0d9488")
NAVY = colors.HexColor("#1e293b")
LIGHT_GRAY = colors.HexColor("#f5f5f4")
BORDER_GRAY = colors.HexColor("#e7e5e4")


def _build_pdf_sync(trip: TripResponse) -> bytes:
    """Build the PDF synchronously (called in executor thread)."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleStyle", parent=styles["Title"],
        fontSize=24, textColor=NAVY, spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "SubtitleStyle", parent=styles["Normal"],
        fontSize=13, textColor=TEAL, spaceAfter=4,
    )
    heading2_style = ParagraphStyle(
        "Heading2Style", parent=styles["Heading2"],
        fontSize=14, textColor=TEAL, spaceBefore=12, spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "BodyStyle", parent=styles["Normal"],
        fontSize=10, textColor=NAVY, spaceAfter=4, leading=14,
    )
    small_style = ParagraphStyle(
        "SmallStyle", parent=styles["Normal"],
        fontSize=9, textColor=colors.HexColor("#64748b"), spaceAfter=3,
    )
    label_style = ParagraphStyle(
        "LabelStyle", parent=styles["Normal"],
        fontSize=9, textColor=colors.HexColor("#64748b"), fontName="Helvetica-Bold",
    )

    story = []

    # ── Cover Page ──────────────────────────────────────────────────────────────
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph("✈ TravelPlanner", subtitle_style))
    story.append(Paragraph(trip.title or f"{trip.destination} Trip", title_style))
    story.append(Paragraph(trip.destination, subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=8))

    # Trip summary table
    start = str(trip.start_date)
    end = str(trip.end_date)
    summary_data = [
        ["Dates", f"{start} → {end}"],
        ["Duration", f"{trip.duration_days} days"],
        ["Travelers", f"{trip.travelers_count} ({trip.traveler_type})"],
        ["Budget", f"{trip.budget_amount:,.0f} {trip.budget_currency}"],
        ["Pace", trip.travel_pace.title()],
    ]
    summary_table = Table(summary_data, colWidths=[40*mm, 120*mm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
        ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
        ("TEXTCOLOR", (1, 0), (1, -1), NAVY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, LIGHT_GRAY]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)
    story.append(PageBreak())

    # ── Day-by-Day Itinerary ───────────────────────────────────────────────────
    story.append(Paragraph("Day-by-Day Itinerary", heading2_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_GRAY, spaceAfter=8))

    for day in trip.itinerary_days:
        # Day header
        day_header = f"Day {day.day_number}"
        if day.date:
            day_header += f" — {day.date}"
        story.append(Paragraph(day_header, heading2_style))
        if day.theme:
            story.append(Paragraph(f"<i>{day.theme}</i>", small_style))
        story.append(Paragraph(f"Daily budget: {day.daily_budget:,.0f} {trip.budget_currency}", small_style))
        story.append(Spacer(1, 4))

        # Activities table
        if day.activities:
            act_data = [["Time", "Activity", "Location", f"Cost ({trip.budget_currency})"]]
            for act in day.activities:
                time_str = f"{act.start_time}–{act.end_time}" if act.start_time and act.end_time else "—"
                act_data.append([
                    time_str,
                    act.name,
                    (act.location or "")[:30],
                    f"{act.estimated_cost:,.0f}" if act.estimated_cost else "—",
                ])
            act_table = Table(act_data, colWidths=[28*mm, 70*mm, 46*mm, 22*mm])
            act_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), TEAL),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
                ("GRID", (0, 0), (-1, -1), 0.3, BORDER_GRAY),
                ("PADDING", (0, 0), (-1, -1), 5),
                ("ALIGN", (3, 0), (3, -1), "RIGHT"),
            ]))
            story.append(act_table)

        story.append(Spacer(1, 10))

    # ── Budget Summary Page ────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Budget Summary", heading2_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_GRAY, spaceAfter=8))

    total_activities_cost = sum(
        a.estimated_cost for d in trip.itinerary_days for a in d.activities if a.estimated_cost
    )
    per_person = trip.budget_amount / max(trip.travelers_count, 1)

    budget_data = [
        ["Total Budget", f"{trip.budget_amount:,.0f} {trip.budget_currency}"],
        ["Estimated Activities Cost", f"{total_activities_cost:,.0f} {trip.budget_currency}"],
        ["Per Person", f"{per_person:,.0f} {trip.budget_currency}"],
        ["Number of Days", str(trip.duration_days)],
        ["Daily Average", f"{trip.budget_amount / max(trip.duration_days, 1):,.0f} {trip.budget_currency}"],
    ]
    budget_table = Table(budget_data, colWidths=[80*mm, 86*mm])
    budget_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, LIGHT_GRAY]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(budget_table)

    # ── Emergency Checklist ────────────────────────────────────────────────────
    story.append(Spacer(1, 12))
    story.append(Paragraph("Emergency Preparation Checklist", heading2_style))
    checklist_items = [
        "☐  Copies of passport and important documents (digital + physical)",
        "☐  Travel insurance policy number and emergency contact",
        "☐  Local emergency services number and embassy contact",
        "☐  Hotel address and booking confirmation",
        "☐  Emergency cash in local currency",
        "☐  Prescription medications (sufficient supply + prescription copies)",
        "☐  Vaccination records if required for destination",
        "☐  Credit/debit card with international coverage",
    ]
    for item in checklist_items:
        story.append(Paragraph(item, body_style))

    doc.build(story)
    return buffer.getvalue()


async def generate_pdf(trip: TripResponse) -> bytes:
    """Generate PDF in a thread executor to avoid blocking the event loop."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _build_pdf_sync, trip)
