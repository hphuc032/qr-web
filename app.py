from flask import Flask, render_template, request, send_file, jsonify
from io import BytesIO
import qrcode.constants
from ChangeLinkToQRCODE import (
    create_qr_object,
    add_label_below_qr,
    create_wifi_payload,
    create_vcard_payload,
    paste_logo_center
)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/generate', methods=['POST'])
def generate_qr():
    try:
        # Lấy dữ liệu từ form
        qr_type = request.form.get('type', 'url')
        fill_color = request.form.get('fill_color', 'black')
        back_color = request.form.get('back_color', 'white')
        error_level = request.form.get('error_level', 'M')
        label_text = request.form.get('label', '')

        # Map error correction
        ec_map = {
            'L': qrcode.constants.ERROR_CORRECT_L,
            'M': qrcode.constants.ERROR_CORRECT_M,
            'Q': qrcode.constants.ERROR_CORRECT_Q,
            'H': qrcode.constants.ERROR_CORRECT_H
        }
        error_correction = ec_map.get(error_level, qrcode.constants.ERROR_CORRECT_M)

        # Tạo data payload dựa trên type
        if qr_type == 'url':
            data = request.form.get('data', '')
            if not data:
                return jsonify({'error': 'Data cannot be empty'}), 400

        elif qr_type == 'wifi':
            ssid = request.form.get('ssid', '')
            password = request.form.get('password', '')
            security = request.form.get('security', 'WPA')
            hidden = request.form.get('hidden', 'false') == 'true'
            
            if not ssid:
                return jsonify({'error': 'SSID cannot be empty'}), 400
            
            data = create_wifi_payload(ssid, password, security, hidden)

        elif qr_type == 'vcard':
            name = request.form.get('name', '')
            phone = request.form.get('phone', '')
            email = request.form.get('email', '')
            company = request.form.get('company', '')
            title = request.form.get('title', '')
            
            if not name or not phone or not email:
                return jsonify({'error': 'Name, phone, and email are required'}), 400
            
            data = create_vcard_payload(name, phone, email, company, title)

        else:
            return jsonify({'error': 'Invalid QR type'}), 400

        # Tạo QR code
        qr_img = create_qr_object(data, error_correction, fill_color, back_color)

        # Thêm logo nếu có
        logo_file = request.files.get('logo')
        if logo_file and logo_file.filename:
            qr_img = paste_logo_center(qr_img, logo_file, len(data))

        # Thêm label nếu có
        if label_text:
            qr_img = add_label_below_qr(qr_img, label_text)

        img_io = BytesIO()
        qr_img.save(img_io, 'PNG')
        img_io.seek(0)
        return send_file(img_io, mimetype='image/png')


    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", "5000"))
    app.run(host='0.0.0.0', port=port, debug=False)
