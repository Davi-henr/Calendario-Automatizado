import flet as ft
from lancamento import lancamento_page
from calendario import calendario_page
from clima import clima_page
from dashboard import dashboard_page
from auth import auth_page

def main(page: ft.Page):
    page.title = "AgroControl — Calendário de Pulverização"
    page.bgcolor = "White"
    page.theme = ft.Theme(
        color_scheme_seed=ft.Colors.BROWN_200,
        use_material3=True
    )
    page.theme_mode = ft.ThemeMode.LIGHT

    def iniciar_sistema(nome_usuario):
        """Callback chamado após login bem-sucedido."""
        page.controls.clear()

        # Cria a página de lançamento (apenas uma vez)
        lancamento_layout, tabela_lancamentos = lancamento_page(page)

        # Conteúdo principal com scroll
        conteudo_principal = ft.ListView(
            expand=True,
            spacing=10,
            controls=[
                ft.Text(f"Bem-vindo, {nome_usuario}! 🌿", size=18, weight=ft.FontWeight.W_500)
            ]
        )

        def abrir_menu(e):
            page.drawer.open = True
            page.update()

        def mudar_pagina(e):
            indice = page.drawer.selected_index
            if indice == 0:
                conteudo_principal.controls = [lancamento_layout]
            elif indice == 1:
                conteudo_principal.controls = [clima_page(page, tabela_lancamentos)]
            elif indice == 2:
                conteudo_principal.controls = [calendario_page(page, tabela_lancamentos)]
            elif indice == 3:
                conteudo_principal.controls = [dashboard_page(page, tabela_lancamentos)]
            page.drawer.open = False
            page.update()

        def fazer_logout(e):
            page.drawer = None
            page.appbar = None
            page.controls.clear()
            tela_auth = auth_page(page, iniciar_sistema)
            page.add(tela_auth)
            page.update()

        page.drawer = ft.NavigationDrawer(
            controls=[
                ft.NavigationDrawerDestination(icon=ft.Icons.ADD_BOX, label="Lançamento"),
                ft.NavigationDrawerDestination(icon=ft.Icons.WB_SUNNY, label="Clima"),
                ft.NavigationDrawerDestination(icon=ft.Icons.CALENDAR_TODAY, label="Calendário"),
                ft.NavigationDrawerDestination(icon=ft.Icons.INSIGHTS, label="Dashboard"),
            ],
            on_change=mudar_pagina,
        )

        page.appbar = ft.AppBar(
            title=ft.Text("Calendário de Pulverização"),
            leading=ft.IconButton(icon=ft.Icons.MENU, on_click=abrir_menu),
            actions=[
                ft.Container(
                    content=ft.Row(
                        controls=[
                            ft.Icon(ft.Icons.PERSON, color=ft.Colors.BROWN_700, size=18),
                            ft.Text(nome_usuario, size=13, color=ft.Colors.BROWN_700),
                            ft.IconButton(
                                icon=ft.Icons.LOGOUT,
                                tooltip="Sair",
                                on_click=fazer_logout,
                                icon_color=ft.Colors.RED_400,
                                icon_size=20,
                            ),
                        ],
                        spacing=5,
                    ),
                    padding=ft.padding.only(right=10),
                ),
            ],
        )

        page.add(conteudo_principal)
        page.update()

    # ===== Tela inicial: Login =====
    tela_auth = auth_page(page, iniciar_sistema)
    page.add(tela_auth)


if __name__ == "__main__":
    ft.app(target=main, view=ft.WEB_BROWSER, port=8080)
