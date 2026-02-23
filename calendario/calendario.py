import flet as ft
import calendar
from datetime import datetime
import json
import os

# Imports da biblioteca ReportLab para gerar o PDF
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch


def calendario_page(page: ft.Page, tabela_lancamentos):
    json_file = "registros.json"
    pulverizacoes = {}
    ultima_data_selecionada = None
    checkboxes_dia = []

    hoje = datetime.today()
    mes_atual = hoje.month
    ano_atual = hoje.year

    meses_pt = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

    # --- Funções de Geração de PDF com ReportLab ---
    def gerar_pdf_relatorio(caminho_arquivo, mes, ano):
        doc = SimpleDocTemplate(caminho_arquivo, pagesize=landscape(letter))
        elementos = []
        estilos = getSampleStyleSheet()
        estilos['h1'].alignment = 1  # Centraliza o H1
        estilos['h2'].alignment = 1  # Centraliza o H2

        titulo_str = f"Relatório de Pulverizações - {meses_pt[mes - 1]} de {ano}"
        titulo = Paragraph(titulo_str, estilos['h1'])
        elementos.append(titulo)
        elementos.append(Spacer(1, 0.25 * inch))

        dados_calendario = [["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]]
        dias_do_mes = calendar.monthcalendar(ano, mes)

        for semana in dias_do_mes:
            dados_calendario.append([str(dia) if dia != 0 else "" for dia in semana])

        estilo_tabela = TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ])

        for i, semana in enumerate(dias_do_mes, 1):
            for j, dia in enumerate(semana):
                if dia != 0:
                    data_str = f"{dia:02d}/{mes:02d}/{ano}"
                    status = obter_status_dia(data_str)
                    cor_fundo_pdf = None
                    if status == "Pendente":
                        cor_fundo_pdf = colors.HexColor("#F08080")
                    elif status == "Parcial":
                        cor_fundo_pdf = colors.HexColor("#FFD700")
                    elif status == "Concluído":
                        cor_fundo_pdf = colors.HexColor("#90EE90")

                    if cor_fundo_pdf:
                        estilo_tabela.add('BACKGROUND', (j, i), (j, i), cor_fundo_pdf)

        tabela_calendario = Table(dados_calendario, colWidths=[1.2 * inch] * 7, rowHeights=0.5 * inch)
        tabela_calendario.setStyle(estilo_tabela)
        elementos.append(tabela_calendario)
        elementos.append(Spacer(1, 0.25 * inch))

        elementos.append(Paragraph("Detalhes das Pulverizações", estilos['h2']))
        dados_pulverizacoes = [["Data", "Quadra", "Receita", "Status"]]
        datas_ordenadas = sorted(pulverizacoes.keys(), key=lambda d: datetime.strptime(d, "%d/%m/%Y"))

        for data in datas_ordenadas:
            if datetime.strptime(data, "%d/%m/%Y").month == mes:
                for pulv in pulverizacoes[data]:
                    linha_ref = pulv["linha_ref"]
                    dados_pulverizacoes.append([
                        data,
                        linha_ref.cells[4].content.content.value,
                        linha_ref.cells[5].content.content.value,
                        pulv["situacao"]
                    ])

        tabela_pulvs = Table(dados_pulverizacoes, colWidths=[1.5 * inch, 2 * inch, 3 * inch, 1.5 * inch])
        tabela_pulvs.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ]))
        elementos.append(tabela_pulvs)
        doc.build(elementos)

    # --- Função de Callback do FilePicker com Tratamento de Erro ---
    def salvar_relatorio_pdf(e: ft.FilePickerResultEvent):
        if not e.path:
            page.snack_bar = ft.SnackBar(ft.Text("Operação cancelada."), bgcolor=ft.colors.BLUE_GREY_500)
            page.snack_bar.open = True
            page.update()
            return

        try:
            caminho_para_salvar = e.path if e.path.endswith(".pdf") else e.path + ".pdf"
            gerar_pdf_relatorio(caminho_para_salvar, mes_atual, ano_atual)

            page.snack_bar = ft.SnackBar(
                ft.Text(f"Relatório salvo com sucesso em: {caminho_para_salvar}"),
                bgcolor=ft.colors.GREEN_700
            )
        except Exception as ex:
            print(f"Erro ao gerar PDF: {ex}")
            page.snack_bar = ft.SnackBar(
                ft.Text(f"Erro ao gerar PDF: {ex}"),
                bgcolor=ft.colors.RED_700
            )

        page.snack_bar.open = True
        page.update()

    file_picker = ft.FilePicker(on_result=salvar_relatorio_pdf)
    if file_picker not in page.overlay:
        page.overlay.append(file_picker)

    def carregar_pulverizacoes():
        pulverizacoes.clear()
        for linha in tabela_lancamentos.rows:
            data_pulverizacao = linha.cells[6].content.content.value
            situacao = linha.cells[8].content.content.value
            if data_pulverizacao not in pulverizacoes:
                pulverizacoes[data_pulverizacao] = []
            pulverizacoes[data_pulverizacao].append({"linha_ref": linha, "situacao": situacao})

    def obter_status_dia(data):
        if data in pulverizacoes:
            status_list = [p["situacao"] for p in pulverizacoes[data]]
            if any(s == "Pendente" for s in status_list):
                if any(s in ["Concluído", "Parcial"] for s in status_list): return "Parcial"
                return "Pendente"
            if all(s == "Parcial" for s in status_list): return "Parcial"
            if all(s == "Concluído" for s in status_list): return "Concluído"
            if any(s == "Parcial" for s in status_list): return "Parcial"
        return None

    def criar_calendario(mes, ano, selecionar_dia_callback, mudar_mes_callback):
        calendar.setfirstweekday(calendar.SUNDAY)
        dias_do_mes = calendar.monthcalendar(ano, mes)
        header = ft.Row([ft.IconButton(ft.icons.ARROW_BACK, on_click=lambda e: mudar_mes_callback(-1)),
                         ft.Text(f"{meses_pt[mes - 1]} {ano}", size=24, weight=ft.FontWeight.BOLD),
                         ft.IconButton(ft.icons.ARROW_FORWARD, on_click=lambda e: mudar_mes_callback(1))],
                        alignment=ft.MainAxisAlignment.CENTER)
        dias_semana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
        cabecalho_dias = ft.Row(
            [ft.Container(ft.Text(dia, weight=ft.FontWeight.BOLD), width=60, alignment=ft.alignment.center) for dia in
             dias_semana], alignment=ft.MainAxisAlignment.CENTER, spacing=10)
        grid_dias = ft.Column(spacing=10)
        for semana in dias_do_mes:
            linha_semana = ft.Row(alignment=ft.MainAxisAlignment.CENTER, spacing=10)
            for dia in semana:
                if dia == 0:
                    linha_semana.controls.append(ft.Container(width=60, height=60))
                else:
                    data_str = f"{dia:02d}/{mes:02d}/{ano}"
                    status = obter_status_dia(data_str)
                    cor_fundo = ft.colors.BROWN_200
                    if status == "Pendente":
                        cor_fundo = ft.colors.RED_400
                    elif status == "Parcial":
                        cor_fundo = ft.colors.AMBER_400
                    elif status == "Concluído":
                        cor_fundo = ft.colors.GREEN_400
                    btn_dia = ft.Container(content=ft.Text(str(dia), size=16), width=60, height=60,
                                           alignment=ft.alignment.center, border_radius=30, bgcolor=cor_fundo,
                                           on_click=lambda e, d=data_str: selecionar_dia_callback(d),
                                           shadow=ft.BoxShadow(blur_radius=5), ink=True)
                    linha_semana.controls.append(btn_dia)
            grid_dias.controls.append(linha_semana)
        return ft.Container(content=ft.Column([header, cabecalho_dias, grid_dias], spacing=20), padding=20,
                            border_radius=15, bgcolor=ft.colors.BROWN_100, shadow=ft.BoxShadow(blur_radius=15))

    def mudar_mes(delta):
        nonlocal mes_atual, ano_atual
        mes_atual += delta
        if mes_atual == 0:
            mes_atual, ano_atual = 12, ano_atual - 1
        elif mes_atual == 13:
            mes_atual, ano_atual = 1, ano_atual + 1
        atualizar_calendario()

    def selecionar_dia(data):
        nonlocal ultima_data_selecionada, checkboxes_dia
        ultima_data_selecionada = data
        tabela_pulverizacoes_dia.rows.clear()
        checkboxes_dia.clear()
        if data in pulverizacoes:
            for i, pulv in enumerate(pulverizacoes[data]):
                linha_ref, chk = pulv["linha_ref"], ft.Checkbox(data=i)
                checkboxes_dia.append(chk)
                tabela_pulverizacoes_dia.rows.append(ft.DataRow(cells=[
                    ft.DataCell(chk),
                    ft.DataCell(ft.Text(linha_ref.cells[4].content.content.value)),
                    ft.DataCell(ft.Text(linha_ref.cells[5].content.content.value)),
                    ft.DataCell(ft.Text(pulv["situacao"], color=get_color_by_status(pulv["situacao"]))),
                ]))
        container_tabela.visible = True
        page.update()

    def get_color_by_status(status):
        if status == "Pendente": return ft.colors.RED_500
        if status == "Parcial": return ft.colors.AMBER_600
        if status == "Concluído": return ft.colors.GREEN_600
        return ft.colors.BLACK

    def marcar_como_parcial(e):
        if not ultima_data_selecionada or ultima_data_selecionada not in pulverizacoes: return
        for chk in checkboxes_dia:
            if chk.value:
                pulv = pulverizacoes[ultima_data_selecionada][chk.data]
                pulv["linha_ref"].cells[8].content.content.value = "Parcial"
                pulv["linha_ref"].cells[8].content.content.color = get_color_by_status("Parcial")
                pulv["situacao"] = "Parcial"
        salvar_registros()
        selecionar_dia(ultima_data_selecionada)
        atualizar_calendario()

    def salvar_registros():
        data_list = [
            {"quantidade_bombas": l.cells[0].content.content.value, "pes_tratados": l.cells[1].content.content.value,
             "marcha": l.cells[2].content.content.value, "data": l.cells[3].content.content.value,
             "quadra": l.cells[4].content.content.value, "receita": l.cells[5].content.content.value,
             "proxima_pulverizacao": l.cells[6].content.content.value, "situacao": l.cells[8].content.content.value} for
            l in tabela_lancamentos.rows]
        with open(json_file, "w", encoding='utf-8') as f: json.dump(data_list, f, indent=4, ensure_ascii=False)

    def atualizar_calendario():
        carregar_pulverizacoes()
        calendario_view.content = criar_calendario(mes_atual, ano_atual, selecionar_dia, mudar_mes)
        calendario_view.update()

    carregar_pulverizacoes()
    calendario_view = ft.Container(content=criar_calendario(mes_atual, ano_atual, selecionar_dia, mudar_mes),
                                   alignment=ft.alignment.top_center, padding=10)
    tabela_pulverizacoes_dia = ft.DataTable(
        columns=[ft.DataColumn(ft.Text("Sel.")), ft.DataColumn(ft.Text("Quadra")), ft.DataColumn(ft.Text("Receita")),
                 ft.DataColumn(ft.Text("Status"))], rows=[])
    container_tabela = ft.Container(content=ft.Column(
        [ft.Text("Pulverizações do Dia", size=18, weight=ft.FontWeight.BOLD), tabela_pulverizacoes_dia,
         ft.ElevatedButton("Marcar Selecionadas como 'Parcial'", icon=ft.icons.EDIT_CALENDAR,
                           on_click=marcar_como_parcial, bgcolor=ft.colors.AMBER_100)],
        horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=15), padding=20, border_radius=10,
                                    bgcolor=ft.colors.WHITE, visible=False)

    botao_gerar_pdf = ft.FloatingActionButton(
        icon=ft.icons.PICTURE_AS_PDF,
        text="Gerar Relatório PDF",
        on_click=lambda _: file_picker.save_file(
            dialog_title="Salvar Relatório PDF",
            file_name=f"Relatorio_{meses_pt[mes_atual - 1]}_{ano_atual}.pdf",
            allowed_extensions=["pdf"]
        ),
        bgcolor=ft.colors.BLUE_GREY_600
    )

    return ft.Column(
        controls=[
            ft.Row([botao_gerar_pdf], alignment=ft.MainAxisAlignment.END),
            calendario_view,
            ft.Divider(height=2, color=ft.colors.BROWN_200),
            container_tabela,
        ],
        scroll=ft.ScrollMode.ADAPTIVE,
        expand=True,
        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
        spacing=20
    )