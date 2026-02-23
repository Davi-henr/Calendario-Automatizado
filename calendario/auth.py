# auth.py — Módulo de Autenticação (Login, Cadastro, Esqueceu Senha)

import flet as ft
import json
import os
import hashlib


USUARIOS_FILE = "usuarios.json"


def _carregar_usuarios():
    if os.path.exists(USUARIOS_FILE):
        try:
            with open(USUARIOS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, ValueError):
            pass
    return []


def _salvar_usuarios(usuarios):
    with open(USUARIOS_FILE, "w", encoding="utf-8") as f:
        json.dump(usuarios, f, indent=4, ensure_ascii=False)


def _hash_senha(senha: str) -> str:
    return hashlib.sha256(senha.encode("utf-8")).hexdigest()


def _encontrar_usuario(usuarios, nome_usuario):
    for u in usuarios:
        if u["usuario"] == nome_usuario:
            return u
    return None


# =====================================================================
#  Componentes visuais reutilizáveis
# =====================================================================

def _criar_campo(label, hint="", password=False, icon=None):
    return ft.TextField(
        label=label,
        hint_text=hint,
        password=password,
        can_reveal_password=password,
        prefix_icon=icon,
        border_radius=10,
        filled=True,
        bgcolor=ft.Colors.with_opacity(0.05, ft.Colors.BROWN),
        border_color=ft.Colors.BROWN_200,
        focused_border_color=ft.Colors.BROWN_400,
        width=340,
    )


def _criar_botao(text, on_click, icon=None):
    return ft.ElevatedButton(
        text=text,
        icon=icon,
        on_click=on_click,
        width=340,
        height=48,
        bgcolor=ft.Colors.BROWN_400,
        color=ft.Colors.WHITE,
        style=ft.ButtonStyle(
            shape=ft.RoundedRectangleBorder(radius=10),
            elevation=4,
        ),
    )


def _criar_link(text, on_click):
    return ft.TextButton(
        text=text,
        on_click=on_click,
        style=ft.ButtonStyle(color=ft.Colors.BROWN_700),
    )


# =====================================================================
#  Função principal: auth_page
# =====================================================================

def auth_page(page: ft.Page, on_login_success):
    """
    Retorna o layout da tela de autenticação.
    on_login_success(nome_usuario) é chamado quando o login é bem-sucedido.
    """

    mensagem = ft.Text("", color=ft.Colors.RED_700, size=13)
    mensagem_sucesso = ft.Text("", color=ft.Colors.GREEN_700, size=13)

    # ------- Campos Login -------
    campo_usuario = _criar_campo("Usuário", hint="Digite seu usuário", icon=ft.Icons.PERSON)
    campo_senha = _criar_campo("Senha", hint="Digite sua senha", password=True, icon=ft.Icons.LOCK)

    # ------- Campos Cadastro -------
    campo_cad_nome = _criar_campo("Nome Completo", hint="Seu nome", icon=ft.Icons.BADGE)
    campo_cad_usuario = _criar_campo("Usuário", hint="Escolha um usuário", icon=ft.Icons.PERSON_ADD)
    campo_cad_senha = _criar_campo("Senha", hint="Crie uma senha", password=True, icon=ft.Icons.LOCK)
    campo_cad_confirmar = _criar_campo("Confirmar Senha", hint="Repita a senha", password=True, icon=ft.Icons.LOCK_OUTLINE)

    # ------- Campos Esqueceu Senha -------
    campo_rec_usuario = _criar_campo("Usuário", hint="Seu usuário cadastrado", icon=ft.Icons.PERSON_SEARCH)
    campo_rec_nova_senha = _criar_campo("Nova Senha", hint="Digite a nova senha", password=True, icon=ft.Icons.LOCK_RESET)
    campo_rec_confirmar = _criar_campo("Confirmar Nova Senha", hint="Repita a nova senha", password=True, icon=ft.Icons.LOCK_OUTLINE)

    # ------- Container principal que troca entre as views -------
    conteudo = ft.AnimatedSwitcher(
        duration=300,
        transition=ft.AnimatedSwitcherTransition.FADE,
    )

    def _limpar_mensagens():
        mensagem.value = ""
        mensagem_sucesso.value = ""

    def _mostrar_erro(texto):
        _limpar_mensagens()
        mensagem.value = texto

    def _mostrar_sucesso(texto):
        _limpar_mensagens()
        mensagem_sucesso.value = texto

    # ============== AÇÕES ==============

    def fazer_login(e):
        usuario = campo_usuario.value.strip()
        senha = campo_senha.value.strip()
        if not usuario or not senha:
            _mostrar_erro("Preencha todos os campos.")
            page.update()
            return

        usuarios = _carregar_usuarios()
        u = _encontrar_usuario(usuarios, usuario)
        if u is None or u["senha"] != _hash_senha(senha):
            _mostrar_erro("Usuário ou senha incorretos.")
            page.update()
            return

        on_login_success(u.get("nome", usuario))

    def fazer_cadastro(e):
        nome = campo_cad_nome.value.strip()
        usuario = campo_cad_usuario.value.strip()
        senha = campo_cad_senha.value.strip()
        confirmar = campo_cad_confirmar.value.strip()

        if not nome or not usuario or not senha or not confirmar:
            _mostrar_erro("Preencha todos os campos.")
            page.update()
            return
        if senha != confirmar:
            _mostrar_erro("As senhas não coincidem.")
            page.update()
            return
        if len(senha) < 4:
            _mostrar_erro("A senha deve ter pelo menos 4 caracteres.")
            page.update()
            return

        usuarios = _carregar_usuarios()
        if _encontrar_usuario(usuarios, usuario):
            _mostrar_erro("Este usuário já existe.")
            page.update()
            return

        usuarios.append({
            "nome": nome,
            "usuario": usuario,
            "senha": _hash_senha(senha),
        })
        _salvar_usuarios(usuarios)

        # Limpar campos
        campo_cad_nome.value = ""
        campo_cad_usuario.value = ""
        campo_cad_senha.value = ""
        campo_cad_confirmar.value = ""

        _mostrar_sucesso("Cadastro realizado com sucesso! Faça login.")
        mostrar_login(None)

    def redefinir_senha(e):
        usuario = campo_rec_usuario.value.strip()
        nova_senha = campo_rec_nova_senha.value.strip()
        confirmar = campo_rec_confirmar.value.strip()

        if not usuario or not nova_senha or not confirmar:
            _mostrar_erro("Preencha todos os campos.")
            page.update()
            return
        if nova_senha != confirmar:
            _mostrar_erro("As senhas não coincidem.")
            page.update()
            return
        if len(nova_senha) < 4:
            _mostrar_erro("A senha deve ter pelo menos 4 caracteres.")
            page.update()
            return

        usuarios = _carregar_usuarios()
        u = _encontrar_usuario(usuarios, usuario)
        if u is None:
            _mostrar_erro("Usuário não encontrado.")
            page.update()
            return

        u["senha"] = _hash_senha(nova_senha)
        _salvar_usuarios(usuarios)

        campo_rec_usuario.value = ""
        campo_rec_nova_senha.value = ""
        campo_rec_confirmar.value = ""

        _mostrar_sucesso("Senha redefinida com sucesso! Faça login.")
        mostrar_login(None)

    # ============== VIEWS ==============

    def _card_wrapper(titulo, icone, campos_lista, botao, links, subtitulo=""):
        return ft.Container(
            width=420,
            padding=ft.padding.all(35),
            border_radius=20,
            bgcolor=ft.Colors.WHITE,
            shadow=ft.BoxShadow(
                spread_radius=1,
                blur_radius=25,
                color=ft.Colors.with_opacity(0.15, ft.Colors.BLACK),
                offset=ft.Offset(0, 8),
            ),
            content=ft.Column(
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                spacing=8,
                controls=[
                    ft.Icon(icone, size=52, color=ft.Colors.BROWN_400),
                    ft.Text(titulo, size=22, weight=ft.FontWeight.BOLD, color=ft.Colors.BROWN_800),
                    ft.Text(subtitulo, size=13, color=ft.Colors.BROWN_400) if subtitulo else ft.Container(),
                    ft.Divider(height=10, color=ft.Colors.TRANSPARENT),
                    *campos_lista,
                    ft.Container(height=5),
                    mensagem,
                    mensagem_sucesso,
                    botao,
                    ft.Container(height=5),
                    *links,
                ],
            ),
        )

    def _view_centralizada(card):
        return ft.Container(
            expand=True,
            alignment=ft.alignment.center,
            gradient=ft.LinearGradient(
                begin=ft.alignment.top_left,
                end=ft.alignment.bottom_right,
                colors=[ft.Colors.BROWN_50, ft.Colors.BROWN_100, ft.Colors.BROWN_50],
            ),
            content=ft.Column(
                alignment=ft.MainAxisAlignment.CENTER,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                expand=True,
                controls=[
                    ft.Text("🌿 AgroControl", size=28, weight=ft.FontWeight.BOLD, color=ft.Colors.BROWN_700),
                    ft.Text("Calendário de Pulverização", size=14, color=ft.Colors.BROWN_400),
                    ft.Container(height=10),
                    card,
                ],
            ),
        )

    def mostrar_login(e):
        _limpar_mensagens()
        card = _card_wrapper(
            titulo="Entrar",
            icone=ft.Icons.AGRICULTURE,
            subtitulo="Acesse sua conta",
            campos_lista=[campo_usuario, campo_senha],
            botao=_criar_botao("Entrar", fazer_login, icon=ft.Icons.LOGIN),
            links=[
                _criar_link("📝 Criar Conta", mostrar_cadastro),
                _criar_link("🔑 Esqueceu a Senha?", mostrar_esqueceu),
            ],
        )
        conteudo.content = _view_centralizada(card)
        page.update()

    def mostrar_cadastro(e):
        _limpar_mensagens()
        card = _card_wrapper(
            titulo="Cadastrar",
            icone=ft.Icons.PERSON_ADD_ALT_1,
            subtitulo="Crie sua conta",
            campos_lista=[campo_cad_nome, campo_cad_usuario, campo_cad_senha, campo_cad_confirmar],
            botao=_criar_botao("Cadastrar", fazer_cadastro, icon=ft.Icons.HOW_TO_REG),
            links=[
                _criar_link("← Voltar ao Login", mostrar_login),
            ],
        )
        conteudo.content = _view_centralizada(card)
        page.update()

    def mostrar_esqueceu(e):
        _limpar_mensagens()
        card = _card_wrapper(
            titulo="Redefinir Senha",
            icone=ft.Icons.LOCK_RESET,
            subtitulo="Redefina sua senha de acesso",
            campos_lista=[campo_rec_usuario, campo_rec_nova_senha, campo_rec_confirmar],
            botao=_criar_botao("Redefinir Senha", redefinir_senha, icon=ft.Icons.PUBLISHED_WITH_CHANGES),
            links=[
                _criar_link("← Voltar ao Login", mostrar_login),
            ],
        )
        conteudo.content = _view_centralizada(card)
        page.update()

    # Iniciar na tela de login
    mostrar_login(None)

    return conteudo
