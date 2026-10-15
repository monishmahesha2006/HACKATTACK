import io
from typing import Any, Dict
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_receipt_pdf(data: Dict[str, Any]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=15
    )
    normal_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    mono_style = ParagraphStyle(
        'DocMono',
        parent=styles['Code'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0284C7')
    )
    badge_style = ParagraphStyle(
        'DocBadge',
        parent=styles['Normal'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#16A34A') if data.get('verdict') == 'VERIFIED' else colors.HexColor('#DC2626'),
        fontName='Helvetica-Bold'
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("REWIND X &bull; CRYPTOGRAPHIC PROOF RECEIPT", title_style))
    story.append(Paragraph("Tamper-Evident Autonomous Execution Record & Audit Verification", subtitle_style))
    story.append(Spacer(1, 10))

    # Summary Table
    verdict_text = f"VERDICT: {data.get('verdict', 'UNKNOWN')}"
    summary_data = [
        [Paragraph("<b>Mission ID</b>", normal_style), Paragraph(str(data.get('mission_id', '')), mono_style)],
        [Paragraph("<b>Status / Verdict</b>", normal_style), Paragraph(verdict_text, badge_style)],
        [Paragraph("<b>Goal</b>", normal_style), Paragraph(str(data.get('goal', '')), normal_style)],
        [Paragraph("<b>Execution Mode</b>", normal_style), Paragraph(str(data.get('mode', '')), normal_style)],
        [Paragraph("<b>Tests Passed</b>", normal_style), Paragraph(f"{data.get('tests_passed', 0)} / {data.get('tests_total', 0)}", normal_style)],
        [Paragraph("<b>Duplicate Writes</b>", normal_style), Paragraph(f"{data.get('duplicates', 0)} (Idempotency Enforced)", normal_style)],
        [Paragraph("<b>Residue State</b>", normal_style), Paragraph(f"{data.get('residue', 0)} bytes / Clean Reversal", normal_style)],
        [Paragraph("<b>Audit Chain Status</b>", normal_style), Paragraph("VALID (Cryptographic SHA-256 Intact)" if data.get('audit_chain_ok') else "INVALID", normal_style)],
        [Paragraph("<b>Final Hash</b>", normal_style), Paragraph(str(data.get('final_hash', '')), mono_style)],
        [Paragraph("<b>Timestamp (UTC)</b>", normal_style), Paragraph(str(data.get('created_at', '')), normal_style)],
    ]

    t = Table(summary_data, colWidths=[140, 390])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    # Verification Details Note
    story.append(Paragraph("<b>Independent Verification Signature</b>", styles['Heading3']))
    story.append(Paragraph(
        f"This cryptographic receipt confirms that the mission state was independently validated against frozen "
        f"acceptance tests and linked to the persistent ledger. Verify endpoint: <i>{data.get('verify_url', '')}</i>",
        normal_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
