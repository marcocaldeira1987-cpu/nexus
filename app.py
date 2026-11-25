import os
from flask import Flask, render_template, request
import resend

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

# Chave pública do Web3Forms (web3forms.com): é ela que envia o formulário
# no site publicado no Cloudflare. Não é secreta — foi feita para estar no HTML.
WEB3FORMS_KEY = ""

# Endereço público do site (usado no formulário quando o JavaScript está desligado)
SITE_URL = "https://nexusdesign.online/"

# Resend: só usado quando o site corre com Python (python app.py).
# A chave vem da variável de ambiente RESEND_API_KEY — nunca escrita no código.
resend.api_key = os.environ.get("RESEND_API_KEY")

# Email onde vais receber as mensagens enviadas pelo site (versão Python)
EMAIL_DESTINO = "marcocaldeira1987@gmail.com"

# ---------------------------------------------------------------------------
# Conteúdo
# ---------------------------------------------------------------------------

SERVICOS = [
    {
        'titulo': 'Web Design & Performance',
        'descricao': 'Websites ultra-rápidos, modernos e otimizados para converter visitantes em clientes.',
        'itens': ['Websites feitos à medida', 'Carregamento ultra-rápido', 'Perfeito no telemóvel', 'Foco em contactos e vendas'],
    },
    {
        'titulo': 'Identidade Visual & Rebranding',
        'descricao': 'Logotipos marcantes e posicionamento de marca que transmite autoridade no mercado.',
        'itens': ['Logotipo e sistema visual', 'Paleta e tipografia', 'Aplicações de marca', 'Guia de identidade'],
    },
    {
        'titulo': 'Transformação Digital de Empresas',
        'descricao': 'Estratégias visuais completas para dar uma nova faceta poderosa ao seu negócio.',
        'itens': ['Estratégia digital', 'Presença online organizada', 'Conteúdos com intenção', 'Acompanhamento contínuo'],
    },
]

# Portefólio: o primeiro da lista aparece primeiro no site.
# Para acrescentar um projeto, basta juntar um novo bloco e a imagem em static/img/projects/.
PROJETOS = [
    {
        'nome': 'Inês Rosa',
        'nome_a': 'Inês', 'nome_b': 'Rosa',  # parte em itálico editorial
        'subtitulo': 'Contabilista Certificada',
        'categoria': 'Web Design / Contabilidade',
        'descricao': 'Uma presença digital elegante e próxima para uma contabilista certificada. '
                     'Tipografia clássica, tons bordeaux e uma mensagem clara: perceber os impostos não tem de ser complicado.',
        'tags': ['Web Design', 'Identidade', 'Sessões online'],
        'imagem': 'img/projects/ines-rosa.webp',
        'url': 'https://inesrosacontabilista.pt/',
        'dominio': 'inesrosacontabilista.pt',
        'cor': '#e7a49c',
        'novo': True,
    },
    {
        'nome': 'PointFino',
        'nome_a': 'Point', 'nome_b': 'Fino',
        'subtitulo': 'Barbershop · Covilhã',
        'categoria': 'Web Design / Barbearia',
        'descricao': 'Uma presença escura, precisa e com carácter, tal como os cortes. '
                     'Marcação direta, equipa e localização a um toque de distância.',
        'tags': ['Web Design', 'Marcações', 'Mobile first'],
        'imagem': 'img/projects/pointfino.webp',
        'url': 'https://pointfino.pt',
        'dominio': 'pointfino.pt',
        'cor': '#3fe0b8',
        'novo': False,
    },
    {
        'nome': 'Casa da Serra',
        'nome_a': 'Casa da', 'nome_b': 'Serra',
        'subtitulo': 'Penhas da Saúde · Serra da Estrela',
        'categoria': 'Web Design / Turismo',
        'descricao': 'Uma casa na serra contada em vídeo de ecrã inteiro. '
                     'A paisagem, a neve e o convite a abrandar dão o tom a toda a experiência.',
        'tags': ['Web Design', 'Vídeo', 'Alojamento'],
        'imagem': 'img/projects/casa-da-serra.webp',
        'url': 'https://casadaserra.online/',
        'dominio': 'casadaserra.online',
        'cor': '#eadbb8',
        'novo': False,
    },
]


def render_home(mensagem_sucesso=None, static_build=False):
    return render_template(
        'index.html',
        servicos=SERVICOS,
        projetos=PROJETOS,
        mensagem_sucesso=mensagem_sucesso,
        static_build=static_build,
        web3forms_key=WEB3FORMS_KEY,
        site_url=SITE_URL,
    )


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

    return render_home(mensagem_sucesso)


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
