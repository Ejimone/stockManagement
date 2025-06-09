"""
PDF Receipt Generation Utility
Generates PDF receipts for sales transactions
"""

import io
from datetime import datetime
from decimal import Decimal
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from django.http import HttpResponse
from .models import Sale


class ReceiptPDFGenerator:
    """Class to generate PDF receipts for sales"""
    
    def __init__(self, sale_id):
        """Initialize with sale ID"""
        try:
            self.sale = Sale.objects.get(id=sale_id)
        except Sale.DoesNotExist:
            raise ValueError(f"Sale with ID {sale_id} not found")
    
    def generate_pdf(self, return_response=True):
        """
        Generate PDF receipt for the sale
        
        Args:
            return_response (bool): If True, returns HttpResponse, else returns PDF buffer
            
        Returns:
            HttpResponse or BytesIO buffer containing PDF
        """
        # Create a file-like buffer to receive PDF data
        buffer = io.BytesIO()
        
        # Create the PDF object, using the buffer as its "file"
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=1*inch,
            bottomMargin=1*inch
        )
        
        # Container for the 'Flowable' objects
        story = []
        
        # Define styles
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        header_style = ParagraphStyle(
            'CustomHeader',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.darkblue
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=6
        )
        
        # Company Header
        story.append(Paragraph("JONKECH STOCK MANAGEMENT", title_style))
        story.append(Paragraph("Sales Receipt", header_style))
        story.append(Spacer(1, 20))
        
        # Receipt Information
        receipt_info = [
            ["Receipt #:", f"RCP-{self.sale.id:06d}"],
            ["Sale ID:", str(self.sale.id)],
            ["Date:", self.sale.created_at.strftime("%B %d, %Y at %I:%M %p")],
            ["Salesperson:", self.sale.salesperson.get_full_name() or self.sale.salesperson.username],
        ]
        
        receipt_table = Table(receipt_info, colWidths=[1.5*inch, 3*inch])
        receipt_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(receipt_table)
        story.append(Spacer(1, 20))
        
        # Items Table Header
        story.append(Paragraph("Items Purchased", header_style))
        story.append(Spacer(1, 10))
        
        # Items table data
        items_data = [
            ["Item", "Qty", "Unit Price", "Total"]
        ]
        
        for item in self.sale.items.all():
            items_data.append([
                item.product_name,
                str(item.quantity),
                f"${item.price_at_sale:.2f}",
                f"${item.subtotal:.2f}"
            ])
        
        # Create items table
        items_table = Table(items_data, colWidths=[3*inch, 0.8*inch, 1.2*inch, 1.2*inch])
        items_table.setStyle(TableStyle([
            # Header row styling
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            
            # Data rows styling
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),  # Item names left-aligned
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),  # Numbers center-aligned
            
            # Grid and borders
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))
        
        story.append(items_table)
        story.append(Spacer(1, 20))
        
        # Payment Summary
        summary_data = [
            ["Subtotal:", f"${self.sale.total_amount:.2f}"],
            ["Payment Method:", self.sale.payment_method],
            ["Amount Paid:", f"${self.sale.amount_paid:.2f}"],
        ]
        
        if self.sale.balance > 0:
            summary_data.append(["Balance Due:", f"${self.sale.balance:.2f}"])
            summary_data.append(["Payment Status:", self.sale.payment_status])
        else:
            summary_data.append(["Payment Status:", "PAID IN FULL"])
        
        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightblue),  # Highlight last row
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 30))
        
        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=9,
            alignment=TA_CENTER,
            textColor=colors.grey
        )
        
        story.append(Paragraph("Thank you for your business!", footer_style))
        story.append(Paragraph("Generated on " + datetime.now().strftime("%B %d, %Y at %I:%M %p"), footer_style))
        
        # Build PDF
        doc.build(story)
        
        # Get the value of the BytesIO buffer and return response
        pdf_value = buffer.getvalue()
        buffer.close()
        
        if return_response:
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="receipt_sale_{self.sale.id}.pdf"'
            response.write(pdf_value)
            return response
        else:
            # Return buffer for other uses
            return io.BytesIO(pdf_value)


def generate_sale_receipt_pdf(sale_id):
    """
    Convenience function to generate PDF receipt for a sale
    
    Args:
        sale_id (int): ID of the sale
        
    Returns:
        HttpResponse: PDF response
    """
    generator = ReceiptPDFGenerator(sale_id)
    return generator.generate_pdf()
