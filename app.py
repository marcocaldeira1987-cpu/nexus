from flask import Flask, render_template, request
import resend

app = Flask(__name__)

# Configuração da chave de API do Resend
resend.api_key = "re_hhxHoD9L_7U4KWye4zcQGteb9QytPombM"

# Email onde vais receber as mensagens enviadas pelo site
EMAIL_DESTINO = "marcocaldeira1987@gmail.com"

@app.route('/', methods=['GET', 'POST'])
def home():
    mensagem_sucesso = None
    
    if request.method == 'POST':
        nome = request.form.get('nome')
        empresa = request.form.get('empresa', 'Não especificada')
        email_cliente = request.form.get('email')
        mensagem_cliente = request.form.get('mensagem')
        
        # Envio do e-mail através da API do Resend
        try:
            r = resend.Emails.send({
                "from": "Nexus Design <onboarding@resend.dev>",
                "to": [EMAIL_DESTINO],
                "reply_to": email_cliente,
                "subject": f"🚀 Nova Lead Nexus Design: {nome} ({empresa})",
                "html": f"""
                <h3>Nova mensagem recebida no site Nexus Design!</h3>
                <p><strong>Nome:</strong> {nome}</p>
                <p><strong>Empresa:</strong> {empresa}</p>
                <p><strong>E-mail de Contacto:</strong> {email_cliente}</p>
                <hr>
                <p><strong>Mensagem / Objetivos:</strong></p>
                <p>{mensagem_cliente}</p>
                """
            })
            print(f"E-mail enviado com sucesso! ID: {r}")
            mensagem_sucesso = f"Obrigado, {nome}! Recebemos o seu pedido e a equipa da Nexus Design entrará em contacto dentro de 24 horas."
        except Exception as e:
            print(f"Erro ao enviar e-mail via Resend: {e}")
            mensagem_sucesso = f"Obrigado, {nome}! Os seus dados foram registados e entraremos em contacto brevemente."

    servicos = [
        {
            'titulo': 'Web Design & Performance',
            'descricao': 'Websites ultra-rápidos, modernos e otimizados para converter visitantes em clientes.'
        },
        {
            'titulo': 'Identidade Visual & Rebranding',
            'descricao': 'Logotipos marcantes e posicionamento de marca que transmite autoridade no mercado.'
        },
        {
            'titulo': 'Transformação Digital de Empresas',
            'descricao': 'Estratégias visuais completas para dar uma nova faceta poderosa ao seu negócio.'
        }
    ]
    return render_template('index.html', servicos=servicos, mensagem_sucesso=mensagem_sucesso)

if __name__ == '__main__':
    app.run(debug=True)