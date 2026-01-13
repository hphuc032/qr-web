# ==================================================
# FILE: ChangeLinkToQRCODE.py
# Core QR generation logic
# ==================================================

import qrcode
import qrcode.constants
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from io import BytesIO


def create_qr_object(data, error_correction, fill_color, back_color):
    """Tạo QR code từ data."""
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=error_correction,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        return qr.make_image(fill_color=fill_color, back_color=back_color).convert("RGB")
    except Exception as e:
        raise Exception(f"Error creating QR: {e}")


def add_label_below_qr(qr_img, text, font_size=32):
    """Thêm label dưới QR."""
    if not text or text.strip() == "":
        return qr_img
    
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            font = ImageFont.load_default()

    w, h = qr_img.size
    
    try:
        bbox = ImageDraw.Draw(qr_img).textbbox((0, 0), text, font=font)
        text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    except:
        try:
            text_w, text_h = ImageDraw.Draw(qr_img).textsize(text, font=font)
        except:
            try:
                text_w, text_h = font.getsize(text)
            except:
                text_w, text_h = len(text) * (font_size // 2), font_size

    padding = 10
    new_h = h + text_h + padding * 2
    new_img = Image.new("RGB", (w, new_h), "white")
    new_img.paste(qr_img, (0, 0))

    draw = ImageDraw.Draw(new_img)
    x = (w - text_w) // 2
    y = h + padding
    draw.text((x, y), text, font=font, fill="black")
    return new_img


def create_wifi_payload(ssid, password, security_type, hidden):
    """Tạo WiFi payload."""
    hidden_str = "true" if hidden else "false"
    return f"WIFI:T:{security_type};S:{ssid};P:{password};H:{hidden_str};;"


def create_vcard_payload(name, phone, email, company="", title=""):
    """Tạo vCard payload."""
    lines = [
        "BEGIN:VCARD", "VERSION:3.0",
        f"N:{name};;;", f"FN:{name}",
        f"TEL;TYPE=CELL:{phone}", f"EMAIL:{email}"
    ]
    if company:
        lines.append(f"ORG:{company}")
    if title:
        lines.append(f"TITLE:{title}")
    lines.append("END:VCARD")
    return "\n".join(lines)


def paste_logo_center(qr_img, logo_file_like, data_len):
    """Dán logo vào giữa QR."""
    try:
        if isinstance(logo_file_like, str):
            logo = Image.open(logo_file_like).convert("RGBA")
        else:
            logo = Image.open(logo_file_like).convert("RGBA")

        qr_w, qr_h = qr_img.size
        
        upscale = 2
        logo = logo.resize((logo.width * upscale, logo.height * upscale), Image.LANCZOS)
        logo = logo.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))

        if data_len < 50:
            ratio = 0.25
        elif data_len < 150:
            ratio = 0.20
        else:
            ratio = 0.15

        logo_size = int(qr_w * ratio)
        logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

        mask = Image.new("L", (logo_size, logo_size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, logo_size, logo_size), fill=255)

        logo_round = Image.new("RGBA", (logo_size, logo_size))
        logo_round.paste(logo, (0, 0), mask=mask)

        border_size = 6
        final_size = logo_size + border_size * 2
        bordered = Image.new("RGBA", (final_size, final_size), (255, 255, 255, 0))
        mask_border = Image.new("L", (final_size, final_size), 0)
        draw_border = ImageDraw.Draw(mask_border)
        draw_border.ellipse((0, 0, final_size, final_size), fill=255)

        draw_b = ImageDraw.Draw(bordered)
        draw_b.ellipse((0, 0, final_size, final_size), fill=(255, 255, 255, 255))

        bordered.paste(logo_round, (border_size, border_size), mask=mask)

        pos = ((qr_w - final_size) // 2, (qr_h - final_size) // 2)
        qr_img.paste(bordered, pos, mask_border)

        return qr_img

    except Exception as e:
        print(f"Error pasting logo: {e}")
        return qr_img

