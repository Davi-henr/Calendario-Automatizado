# lancamento.py (VERSÃO FINAL)

import flet as ft
from datetime import datetime, timedelta
import json
import os


registros = []


def lancamento_page(page: ft.Page):
    json_file = "registros.json"
    checkboxes = []
    linha_editando = None

    # ===================================================================
    # 1. DEFINIÇÃO DE TODAS AS FUNÇÕES
    # ===================================================================

    def salvar_registros():
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(registros, f, indent=4, ensure_ascii=False)

    def atualizar_botao_excluir():
        botao_excluir.visible = any(cb.value for cb in checkboxes)
        if botao_excluir.page:
            botao_excluir.update()

    def editar_registro(reg, linha_ref):
        nonlocal linha_editando
        linha_editando = linha_ref
        campo_edit_quantidade_bombas.value = str(reg.get("quantidade_bombas", ""))
        campo_edit_pes_tratados.value = str(reg.get("pes_tratados", ""))
        campo_edit_marcha.value = str(reg.get("marcha", ""))
        campo_edit_data.value = str(reg.get("data", ""))
        campo_edit_quadra.value = str(reg.get("quadra", ""))
        campo_edit_receita.value = str(reg.get("receita", ""))
        campo_edit_dias_carencia.value = str(reg.get("dias_carencia", "0"))
        campo_finalizar.value = (reg.get("situacao") == "Concluído")
        dialog_edicao.open = True
        if dialog_edicao.page:
            page.update()

    def criar_linha(reg):
        ch = ft.Checkbox(value=False, on_change=lambda _: atualizar_botao_excluir())
        checkboxes.append(ch)

        def editar_click(e):
            editar_registro(reg, linha)

        btn_editar = ft.IconButton(icon=ft.icons.EDIT, on_click=editar_click, icon_size=18, tooltip="Editar")

        if reg.get("situacao") == "Concluído":
            valor_dias = ""
        else:
            try:
                prox_date = datetime.strptime(reg["proxima_pulverizacao"], "%d/%m/%Y").date()
                diff = (prox_date - datetime.today().date()).days
                valor_dias = str(diff)
            except (ValueError, KeyError):
                valor_dias = "?"

        cor_sit = ft.colors.GREEN_700 if reg.get("situacao") == "Concluído" else ft.colors.RED_700

        linha = ft.DataRow(
            cells=[
                ft.DataCell(ft.Container(content=ft.Text(str(reg.get("quantidade_bombas", ""))),
                                         alignment=ft.alignment.center)),
                ft.DataCell(
                    ft.Container(content=ft.Text(str(reg.get("pes_tratados", ""))), alignment=ft.alignment.center)),
                ft.DataCell(ft.Container(content=ft.Text(str(reg.get("marcha", ""))), alignment=ft.alignment.center)),
                ft.DataCell(ft.Container(content=ft.Text(str(reg.get("data", ""))), alignment=ft.alignment.center)),
                ft.DataCell(ft.Container(content=ft.Text(str(reg.get("quadra", ""))), alignment=ft.alignment.center)),
                ft.DataCell(ft.Container(content=ft.Text(str(reg.get("receita", ""))))),
                ft.DataCell(ft.Container(content=ft.Text(str(reg.get("proxima_pulverizacao", ""))),
                                         alignment=ft.alignment.center)),
                ft.DataCell(ft.Container(content=ft.Text(valor_dias), alignment=ft.alignment.center)),
                ft.DataCell(ft.Container(
                    content=ft.Text(str(reg.get("situacao", "")), color=cor_sit, weight=ft.FontWeight.BOLD),
                    alignment=ft.alignment.center)),
                ft.DataCell(
                    ft.Container(content=ft.Text(str(reg.get("data_conclusao", ""))), alignment=ft.alignment.center)),
                ft.DataCell(ch),
                ft.DataCell(btn_editar),
            ]
        )
        linha.record = reg
        data_table.rows.append(linha)

    def atualizar_tabela():
        data_table.rows.clear()
        checkboxes.clear()
        registros_filtrados = []
        for r in registros:
            if filtro_receita.value != "Todos" and r.get("receita") != filtro_receita.value:
                continue
            if filtro_quadra.value != "Todos" and r.get("quadra") != filtro_quadra.value:
                continue
            registros_filtrados.append(r)

        registros_filtrados.sort(key=lambda r: datetime.strptime(r["data"], "%d/%m/%Y"))

        for reg in registros_filtrados:
            criar_linha(reg)

        atualizar_botao_excluir()
        if data_table.page:
            data_table.update()

    def carregar_registros():
        registros.clear()
        if os.path.exists(json_file):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    registros.extend(json.load(f))
            except (json.JSONDecodeError, ValueError):
                print("Erro ao carregar JSON! Criando um arquivo vazio.")
                salvar_registros()
        atualizar_tabela()

    def salvar_edicao(e):
        nonlocal linha_editando
        if linha_editando is None: return
        reg = linha_editando.record
        try:
            reg["quantidade_bombas"] = campo_edit_quantidade_bombas.value
            reg["pes_tratados"] = campo_edit_pes_tratados.value
            reg["marcha"] = campo_edit_marcha.value
            reg["data"] = campo_edit_data.value
            reg["quadra"] = campo_edit_quadra.value
            reg["receita"] = campo_edit_receita.value
            dias_carencia_edit = int(campo_edit_dias_carencia.value.strip() or "0")
            reg["dias_carencia"] = str(dias_carencia_edit)
            data_edit_dt = datetime.strptime(reg["data"], "%d/%m/%Y")
            reg["proxima_pulverizacao"] = (data_edit_dt + timedelta(days=dias_carencia_edit)).strftime("%d/%m/%Y")

            if campo_finalizar.value:
                reg["situacao"] = "Concluído"
                reg["data_conclusao"] = reg["data"]
            else:
                reg["situacao"] = "Pendente"
                reg["data_conclusao"] = ""

            salvar_registros()
            dialog_edicao.open = False
            atualizar_tabela()
            page.update()
        except Exception as err:
            print(f"Erro ao salvar edição: {err}")

    def excluir_selecionados(e):
        registros_a_remover = [row.record for row, cb in zip(data_table.rows, checkboxes) if cb.value]
        if not registros_a_remover: return

        registros[:] = [reg for reg in registros if reg not in registros_a_remover]
        salvar_registros()
        atualizar_tabela()
        page.update()

    def adicionar_registro(e):
        try:
            data_input = datetime.strptime(campo_data.value, "%d/%m/%Y")
            quadra_valor = campo_quadra.value
            receita_valor = campo_receita.value
            dias_carencia_val = int(campo_dias_carencia.value)

            for r in registros:
                if (r["quadra"] == quadra_valor and r["receita"] == receita_valor and r["situacao"] != "Concluído"):
                    r["situacao"] = "Concluído"
                    r["data_conclusao"] = campo_data.value

            novo_reg = {
                "quantidade_bombas": campo_quantidade_bombas.value,
                "pes_tratados": campo_pes_tratados.value,
                "marcha": campo_marcha.value,
                "data": campo_data.value,
                "data_inicial": campo_data_inicial.value,
                "quadra": quadra_valor,
                "receita": receita_valor,
                "dias_carencia": str(dias_carencia_val),
                "proxima_pulverizacao": (data_input + timedelta(days=dias_carencia_val)).strftime("%d/%m/%Y"),
                "situacao": "Pendente",
                "data_conclusao": ""
            }
            registros.append(novo_reg)
            salvar_registros()
            atualizar_tabela()

            for field in [campo_data_inicial, campo_data, campo_dias_carencia, campo_quantidade_bombas,
                          campo_pes_tratados]:
                field.value = ""
            for dropdown in [campo_quadra, campo_receita, campo_marcha]:
                dropdown.value = None

            page.update()

        except (ValueError, TypeError):
            page.snack_bar = ft.SnackBar(ft.Text("Erro: Verifique todos os campos e datas."), bgcolor=ft.colors.RED)
            page.snack_bar.open = True
            page.update()

    def selecionar_data(e):
        if date_picker.value:
            campo_data.value = date_picker.value.strftime("%d/%m/%Y")
            if campo_data.page: campo_data.update()

    def abrir_calendario(e):
        date_picker.open = True
        page.update()

    def selecionar_data_inicial(e):
        if date_picker_inicial.value:
            campo_data_inicial.value = date_picker_inicial.value.strftime("%d/%m/%Y")
            if campo_data_inicial.page: campo_data_inicial.update()

    def abrir_calendario_inicial(e):
        date_picker_inicial.open = True
        page.update()

    # ===================================================================
    # 2. DEFINIÇÃO DOS COMPONENTES DA INTERFACE (WIDGETS)
    # ===================================================================

    # Removidos os parâmetros não suportados pela sua versão do Flet
    date_picker = ft.DatePicker(
        on_change=selecionar_data,
        first_date=datetime(2020, 1, 1),
        last_date=datetime(2030, 12, 31),
        date_picker_entry_mode=ft.DatePickerEntryMode.CALENDAR_ONLY
    )
    date_picker_inicial = ft.DatePicker(
        on_change=selecionar_data_inicial,
        first_date=datetime(2020, 1, 1),
        last_date=datetime(2030, 12, 31),
        date_picker_entry_mode=ft.DatePickerEntryMode.CALENDAR_ONLY
    )

    if date_picker not in page.overlay: page.overlay.append(date_picker)
    if date_picker_inicial not in page.overlay: page.overlay.append(date_picker_inicial)

    quadra_options = ["001", "002", "003", "004", "005A", "005B", "005C", "006A", "006B", "007", "008", "009", "010",
                      "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "024", "026",
                      "027", "028", "029", "030", "031", "032", "033", "034"]
    receita_options = ["Chuá", "Leprose", "Alternária", "Pinta Preta", "Aplicação de Winner", "Herbicida"]
    marcha_options = ["1ªA", "1ªRA", "2ªA", "2ªRA", "3ªA", "3ªRA", "4ªA", "4ªRA"]

    campo_data_inicial = ft.TextField(label="Data Inicial", hint_text="DD/MM/AAAA",
                                      suffix=ft.IconButton(ft.icons.CALENDAR_MONTH, on_click=abrir_calendario_inicial),
                                      text_align=ft.TextAlign.CENTER)
    campo_data = ft.TextField(label="Data Final", hint_text="DD/MM/AAAA",
                              suffix=ft.IconButton(ft.icons.CALENDAR_MONTH, on_click=abrir_calendario),
                              text_align=ft.TextAlign.CENTER)
    campo_quadra = ft.Dropdown(label="Quadra", hint_text="Selecione",
                               options=[ft.dropdown.Option(opt) for opt in quadra_options])
    campo_receita = ft.Dropdown(label="Receita", hint_text="Selecione",
                                options=[ft.dropdown.Option(opt) for opt in receita_options])
    campo_dias_carencia = ft.TextField(label="Dias de Carência", hint_text="Ex: 7",
                                       keyboard_type=ft.KeyboardType.NUMBER, text_align=ft.TextAlign.CENTER)
    campo_quantidade_bombas = ft.TextField(label="Nº Bombas", keyboard_type=ft.KeyboardType.NUMBER,
                                           text_align=ft.TextAlign.CENTER)
    campo_pes_tratados = ft.TextField(label="Pés Tratados", keyboard_type=ft.KeyboardType.NUMBER,
                                      text_align=ft.TextAlign.CENTER)
    campo_marcha = ft.Dropdown(label="Marcha", hint_text="Selecione",
                               options=[ft.dropdown.Option(opt) for opt in marcha_options])

    campo_edit_quantidade_bombas = ft.TextField(label="Quantidade de Bombas")
    campo_edit_pes_tratados = ft.TextField(label="Pés Tratados")
    campo_edit_marcha = ft.Dropdown(label="Marcha", options=[ft.dropdown.Option(opt) for opt in marcha_options])
    campo_edit_data = ft.TextField(label="Data Final")
    campo_edit_quadra = ft.TextField(label="Quadra")
    campo_edit_receita = ft.TextField(label="Receita de Tratamento")
    campo_edit_dias_carencia = ft.TextField(label="Dias de Carência", keyboard_type=ft.KeyboardType.NUMBER)
    campo_finalizar = ft.Checkbox(label="Marcar como Finalizado", value=False)

    filtro_receita = ft.Dropdown(label="Filtrar por Receita",
                                 options=[ft.dropdown.Option("Todos")] + [ft.dropdown.Option(opt) for opt in
                                                                          receita_options], value="Todos",
                                 on_change=lambda e: atualizar_tabela(), dense=True)
    filtro_quadra = ft.Dropdown(label="Filtrar por Quadra",
                                options=[ft.dropdown.Option("Todos")] + [ft.dropdown.Option(opt) for opt in
                                                                         quadra_options], value="Todos",
                                on_change=lambda e: atualizar_tabela(), dense=True)

    botao_excluir = ft.ElevatedButton("Excluir Selecionados", icon=ft.icons.DELETE_SWEEP, on_click=excluir_selecionados,
                                      visible=False, color=ft.colors.RED)

    dialog_edicao = ft.AlertDialog(
        modal=True, title=ft.Text("Editar Registro"),
        content=ft.Column([
            campo_edit_quantidade_bombas, campo_edit_pes_tratados, campo_edit_marcha,
            campo_edit_data, campo_edit_quadra, campo_edit_receita,
            campo_edit_dias_carencia, campo_finalizar
        ], tight=True, scroll=ft.ScrollMode.ADAPTIVE),
        actions=[
            ft.TextButton("Cancelar", on_click=lambda e: setattr(dialog_edicao, "open", False) or page.update()),
            ft.FilledButton("Salvar Alterações", on_click=salvar_edicao),
        ],
        actions_alignment=ft.MainAxisAlignment.END,
    )

    column_names = ["Bombas", "Pés Trat.", "Marcha", "Data", "Quadra", "Receita", "Próx Pulve.", "Venc.", "Situação",
                    "Conclusão", "Sel.", "Edit"]
    data_table = ft.DataTable(
        columns=[ft.DataColumn(ft.Text(name)) for name in column_names],
        rows=[],
        heading_row_color=ft.colors.BROWN_50, heading_row_height=40, data_row_max_height=45,
        border=ft.border.all(1, ft.colors.BROWN_200), border_radius=8,
        vertical_lines=ft.border.BorderSide(1, ft.colors.BROWN_100),
    )

    # ===================================================================
    # 3. MONTAGEM DO LAYOUT FINAL
    # ===================================================================

    form_card = ft.Card(
        elevation=4,
        content=ft.Container(
            padding=ft.padding.all(20),
            content=ft.Column([
                ft.Text("Novo Lançamento", style=ft.TextThemeStyle.TITLE_LARGE),
                ft.ResponsiveRow(
                    controls=[
                        ft.Column(col={"sm": 6, "md": 3}, controls=[campo_quantidade_bombas]),
                        ft.Column(col={"sm": 6, "md": 3}, controls=[campo_pes_tratados]),
                        ft.Column(col={"sm": 6, "md": 3}, controls=[campo_marcha]),
                        ft.Column(col={"sm": 6, "md": 3}, controls=[campo_dias_carencia]),
                    ],
                    spacing=15, run_spacing=10
                ),
                ft.ResponsiveRow(
                    controls=[
                        ft.Column(col={"sm": 6, "md": 3}, controls=[campo_data_inicial]),
                        ft.Column(col={"sm": 6, "md": 3}, controls=[campo_data]),
                        ft.Column(col={"sm": 6, "md": 3}, controls=[campo_quadra]),
                        ft.Column(col={"sm": 6, "md": 3}, controls=[campo_receita]),
                    ],
                    spacing=15, run_spacing=10
                ),
                ft.Row(
                    [ft.FilledButton("Salvar Registro", icon=ft.icons.SAVE, on_click=adicionar_registro, height=45)],
                    alignment=ft.MainAxisAlignment.END
                )
            ])
        )
    )

    table_card = ft.Card(
        elevation=4,
        content=ft.Container(
            padding=ft.padding.all(20),
            content=ft.Column([
                ft.Row([
                    ft.Text("Registros", style=ft.TextThemeStyle.TITLE_LARGE),
                    ft.Row(controls=[filtro_quadra, filtro_receita], spacing=15)
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),

                ft.Column(
                    controls=[data_table],
                    scroll=ft.ScrollMode.ADAPTIVE,
                    expand=True,
                ),
                ft.Row([botao_excluir], alignment=ft.MainAxisAlignment.END)
            ])
        )
    )

    layout_final = ft.Column(
        controls=[
            form_card,
            ft.Container(content=table_card, expand=True),
            dialog_edicao,
        ],
        spacing=20,
        expand=True,
    )

    # ===================================================================
    # 4. CARGA INICIAL E RETORNO
    # ===================================================================
    carregar_registros()

    return layout_final, data_table