"""
PDF Receipt Generator for Sales
Generates professional PDF receipts for sales transactions.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas


class ReceiptPDFGenerator:
    """Generates PDF receipts for sales transactions."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom paragraph styles for the receipt."""
        # Company header style
        self.styles.add(ParagraphStyle(
            name='CompanyHeader',
            parent=self.styles['Title'],
            fontSize=20,
            spaceAfter=12,
            alignment=TA_CENTER,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        ))
        
        # Receipt title style
        self.styles.add(ParagraphStyle(
            name='ReceiptTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=12,
            alignment=TA_CENTER,
            textColor=colors.darkred,
            fontName='Helvetica-Bold'
        ))
        
        # Info section style
        self.styles.add(ParagraphStyle(
            name='InfoText',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            alignment=TA_LEFT,
            fontName='Helvetica'
        ))
        
        # Bold info style
        self.styles.add(ParagraphStyle(
            name='BoldInfo',
            parent=self.styles['InfoText'],
            fontName='Helvetica-Bold'
        ))
        
        # Total style
        self.styles.add(ParagraphStyle(
            name='TotalText',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceAfter=6,
            alignment=TA_RIGHT,
            fontName='Helvetica-Bold',
            textColor=colors.darkgreen
        ))
    
    def generate_receipt(self, sale_data):
        """
        Generate a PDF receipt for a sale.
        
        Args:
            sale_data: Dictionary containing sale information
            
        Returns:
            BytesIO object containing the PDF data
        """
        buffer = io.BytesIO()
        
        # Create the PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Build the story (content)
        story = []
        
        # Company header
        story.append(Paragraph("Jonkech Stock Management", self.styles['CompanyHeader']))
        story.append(Spacer(1, 12))
        
        # Receipt title
        story.append(Paragraph("SALES RECEIPT", self.styles['ReceiptTitle']))
        story.append(Spacer(1, 12))
        
        # Receipt info section
        receipt_info = [
            f"<b>Receipt No:</b> {sale_data.get('id', 'N/A')}",
            f"<b>Date:</b> {self._format_date(sale_data.get('created_at'))}",
            f"<b>Salesperson:</b> {sale_data.get('salesperson_name', 'N/A')}",
            f"<b>Payment Method:</b> {sale_data.get('payment_method', 'N/A')}",
        ]
        
        for info in receipt_info:
            story.append(Paragraph(info, self.styles['InfoText']))
        
        story.append(Spacer(1, 20))
        
        # Items table
        items_data = [['Item', 'Qty', 'Unit Price', 'Total']]
        
        total_amount = 0
        for item in sale_data.get('products_sold', []):
            quantity = item.get('quantity', 0)
            price = float(item.get('price_at_sale', 0))
            item_total = quantity * price
            total_amount += item_total
            
            items_data.append([
                item.get('name', 'Unknown Product'),
                str(quantity),
                f"${price:.2f}",
                f"${item_total:.2f}"
            ])
        
        # Create the table
        items_table = Table(items_data, colWidths=[3*inch, 0.8*inch, 1.2*inch, 1.2*inch])
        items_table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            
            # Data rows
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),  # Item names left aligned
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),  # Numbers center aligned
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        story.append(items_table)
        story.append(Spacer(1, 20))
        
        # Payment summary
        amount_paid = float(sale_data.get('amount_paid', 0))
        balance = float(sale_data.get('balance', 0))
        payment_status = sale_data.get('payment_status', 'Unknown')
        
        summary_data = [
            ['Subtotal:', f"${total_amount:.2f}"],
            ['Amount Paid:', f"${amount_paid:.2f}"],
            ['Balance:', f"${balance:.2f}"],
            ['Status:', payment_status]
        ]
        
        summary_table = Table(summary_data, colWidths=[4*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('FONTNAME', (0, -2), (-1, -1), 'Helvetica-Bold'),  # Last two rows bold
            ('FONTSIZE', (0, -2), (-1, -1), 12),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.darkgreen),  # Status row green
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 30))
        
        # Footer
        footer_text = [
            "Thank you for your business!",
            "For inquiries, please contact us.",
            f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        ]
        
        for text in footer_text:
            story.append(Paragraph(text, self.styles['InfoText']))
        
        # Build the PDF
        doc.build(story)
        
        # Get the value of the BytesIO buffer
        pdf_data = buffer.getvalue()
        buffer.close()
        
        return pdf_data
    
    def _format_date(self, date_string):
        """Format date string for display."""
        if not date_string:
            return "N/A"
        
        try:
            # Parse the ISO date string and format it nicely
            if isinstance(date_string, str):
                date_obj = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            else:
                date_obj = date_string
            
            return date_obj.strftime('%B %d, %Y at %I:%M %p')
        except (ValueError, AttributeError):
            return str(date_string)


# Utility function to generate receipt
def generate_sale_receipt(sale_data):
    """
    Generate a PDF receipt for a sale.
    
    Args:
        sale_data: Dictionary containing sale information
        
    Returns:
        BytesIO object containing the PDF data
    """
    generator = ReceiptPDFGenerator()
    return generator.generate_receipt(sale_data)
