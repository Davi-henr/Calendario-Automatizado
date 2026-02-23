import flet as ft
from datetime import datetime, timedelta
import calendar
import requests
import json
import os
import pandas as pd
from fpdf import FPDF
import base64

# --- CONFIGURAÇÕES E ESTILO ---
API_KEY = "29f247c5a06de34f0992ec03ba8f0a12"
CIDADE = "Bariri, São Paulo, BR"
ARQUIVO_CHUVAS_MANUAIS = "chuvas_manuais.json"


class Style:
    BG_COLOR = "#F8F9FA"
    CARD_COLOR = "#FFFFFF"
    PRIMARY_COLOR = "#4E73DF"
    SIDEBAR_COLOR = "#FFFFFF"
    TEXT_DARK = "#343A40"
    TEXT_LIGHT = "#6C757D"
    GREEN_COLOR = "#1CC88A"
    RED_COLOR = "#E74A3B"
    BORDER_COLOR = "#e0e5ec"
    ACCENT_COLOR = PRIMARY_COLOR


icones_clima = {
    "Clear": (ft.icons.WB_SUNNY_ROUNDED, "#FFC107"), "Clouds": (ft.icons.CLOUD_QUEUE_ROUNDED, "#90A4AE"),
    "Rain": (ft.icons.GRAIN_ROUNDED, "#42A5F5"), "Thunderstorm": (ft.icons.THUNDERSTORM_ROUNDED, "#7B1FA2"),
    "Drizzle": (ft.icons.WATER_DROP_ROUNDED, "#81D4FA"), "Snow": (ft.icons.AC_UNIT_ROUNDED, "#FFFFFF"),
    "Mist": (ft.icons.FOGGY, "#B0BEC5"), "Smoke": (ft.icons.SMOKE_FREE, "#A1887F"),
    "Haze": (ft.icons.FILTER_DRAMA_ROUNDED, "#CFD8DC"), "Dust": (ft.icons.GRAIN, "#BCAAA4"),
    "Fog": (ft.icons.FOGGY, "#B0BEC5"), "Sand": (ft.icons.GRAIN, "#FFD54F"),
    "Ash": (ft.icons.FIREPLACE_ROUNDED, "#616161"), "Squall": (ft.icons.WIND_POWER_ROUNDED, "#37474F"),
    "Tornado": (ft.icons.TORNADO_ROUNDED, "#212121"),
}

dias_semana_pt_abrev = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
dias_semana_pt_completo = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
meses_pt = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro",
            "Novembro", "Dezembro"]
locais_coleta = ["Pluviômetro Quadra 17", "Pluviômetro Murcote", "Pluviômetro Piscinao", "Pluviômetro Portaria"]


class PDF(FPDF):
    def __init__(self, report_title="Relatório", periodo="", *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.report_title = report_title
        self.periodo = periodo
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        self.set_font("Arial", "B", 20)
        self.cell(0, 10, self.report_title, ln=True, align="C")
        self.set_font("Arial", "", 12)
        if self.periodo:
            self.cell(0, 10, f"Período de Análise: {self.periodo}", ln=True, align="C")
        now = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        self.set_font("Arial", "", 8)
        self.cell(0, 10, f"Emissão: {now}", ln=True, align="R")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Página {self.page_no()}/{{nb}}", 0, 0, "C")


def gerar_pdf_relatorio_chuva(df_filtrado, data_inicio, data_fim, file_path, page: ft.Page):
    periodo_str = f"{data_inicio} a {data_fim}"
    pdf = PDF(report_title="Precipitação em MM - Fazenda Vale dos Laranjais", periodo=periodo_str)
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Resumo de Acumulado por Pluviômetro", ln=True, align="L")
    pdf.ln(2)
    resumo_df = df_filtrado.groupby("local")["mm"].sum().reset_index()
    pdf.set_font("Arial", "B", 11)
    pdf.cell(100, 10, "Pluviômetro", border=1, align="C")
    pdf.cell(50, 10, "Total Acumulado (mm)", border=1, align="C")
    pdf.ln()
    pdf.set_font("Arial", "", 11)
    for _, row in resumo_df.iterrows():
        pdf.cell(100, 10, str(row["local"]), border=1)
        pdf.cell(50, 10, f"{row['mm']:.1f}", border=1, align="R")
        pdf.ln()
    pdf.ln(10)
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Registros Detalhados", ln=True, align="L")
    pdf.ln(2)
    col_widths = [40, 90, 40]
    headers = ["Data", "Pluviômetro", "Precipitação (mm)"]

    def print_table_header():
        pdf.set_font("Arial", "B", 11)
        for i, header in enumerate(headers): pdf.cell(col_widths[i], 10, header, border=1, align="C")
        pdf.ln()

    print_table_header()
    # =========================================================================================
    # LINHA CORRIGIDA: Ordenar pelo campo 'data_dt' que já está no formato datetime.
    df_sorted = df_filtrado.sort_values(by='data_dt')
    # =========================================================================================
    for _, row in df_sorted.iterrows():
        if pdf.get_y() > pdf.h - 25:
            pdf.add_page()
            print_table_header()
        pdf.set_font("Arial", "", 10)
        pdf.cell(col_widths[0], 10, str(row["data"]), border=1, align="C")
        pdf.cell(col_widths[1], 10, str(row["local"]), border=1)
        pdf.set_font("Arial", "B", 10)
        pdf.cell(col_widths[2], 10, f"{row['mm']:.1f}", border=1, align="R")
        pdf.ln()
    pdf.output(file_path)
    with open(file_path, "rb") as f:
        pdf_bytes = f.read()
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    page.launch_url(f"data:application/pdf;base64,{pdf_b64}")


class CustomDatePicker(ft.AlertDialog):
    def __init__(self, target_textfield):
        super().__init__()
        self.target_textfield = target_textfield
        self.modal = True
        self.title = self._build_header()
        self.content = self._build_calendar_grid()
        self.actions_alignment = ft.MainAxisAlignment.END
        self.actions = [ft.TextButton("Fechar", on_click=self._close_dialog)]
        self.current_date = datetime.now()
        self._update_calendar()

    def _close_dialog(self, e):
        self.open = False;
        self.page.update()

    def _build_header(self):
        self.month_year_text = ft.Text(weight=ft.FontWeight.BOLD)
        return ft.Row([ft.IconButton(ft.icons.CHEVRON_LEFT, on_click=self._prev_month), self.month_year_text,
                       ft.IconButton(ft.icons.CHEVRON_RIGHT, on_click=self._next_month)],
                      alignment=ft.MainAxisAlignment.CENTER)

    def _build_calendar_grid(self):
        self.calendar_grid = ft.GridView(expand=False, max_extent=40, runs_count=7, spacing=5, run_spacing=5)
        header = ft.Row([ft.Text(day, text_align=ft.TextAlign.CENTER, width=40) for day in dias_semana_pt_abrev])
        return ft.Column([header, self.calendar_grid], width=300, height=280)

    def _update_calendar(self):
        year, month = self.current_date.year, self.current_date.month
        self.month_year_text.value = f"{meses_pt[month - 1]} {year}";
        self.calendar_grid.controls.clear()
        month_calendar = calendar.monthcalendar(year, month)
        for week in month_calendar:
            for day in week:
                if day == 0:
                    self.calendar_grid.controls.append(ft.Container())
                else:
                    is_today = (
                            day == datetime.now().day and month == datetime.now().month and year == datetime.now().year)
                    self.calendar_grid.controls.append(
                        ft.TextButton(text=str(day), on_click=self._on_day_click, data=(year, month, day),
                                      style=ft.ButtonStyle(shape=ft.CircleBorder(),
                                                           color=ft.colors.WHITE if is_today else None,
                                                           bgcolor=Style.ACCENT_COLOR if is_today else None)))
        if self.page: self.update()

    def _on_day_click(self, e):
        year, month, day = e.control.data
        self.target_textfield.value = datetime(year, month, day).strftime("%d/%m/%Y")
        self.open = False;
        self.target_textfield.update();
        self.page.update()

    def _prev_month(self, e):
        year, month = self.current_date.year, self.current_date.month
        if month == 1:
            month, year = 12, year - 1
        else:
            month -= 1
        self.current_date = self.current_date.replace(year=year, month=month, day=1);
        self._update_calendar()

    def _next_month(self, e):
        year, month = self.current_date.year, self.current_date.month
        if month == 12:
            month, year = 1, year + 1
        else:
            month += 1
        self.current_date = self.current_date.replace(year=year, month=month, day=1);
        self._update_calendar()

    def open_picker(self, e):
        self.open = True;
        self.page.update()


def carregar_dados_json(caminho_arquivo):
    if not os.path.exists(caminho_arquivo): return []
    try:
        with open(caminho_arquivo, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def salvar_dados_json(caminho_arquivo, dados):
    with open(caminho_arquivo, "w", encoding="utf-8") as f: json.dump(dados, f, indent=4, ensure_ascii=False)


def buscar_previsao_tempo(tabela_lancamentos):
    dias_pulverizacao = {}
    if hasattr(tabela_lancamentos, 'rows'):
        for linha in tabela_lancamentos.rows:
            if len(linha.cells) > 8:
                try:
                    data_pulv, status = linha.cells[6].content.content.value, linha.cells[8].content.content.value
                    if data_pulv not in dias_pulverizacao: dias_pulverizacao[data_pulv] = {"pendente": 0,
                                                                                           "concluido": 0}
                    if status == "Pendente":
                        dias_pulverizacao[data_pulv]["pendente"] += 1
                    elif status == "Concluído":
                        dias_pulverizacao[data_pulv]["concluido"] += 1
                except AttributeError:
                    print("Aviso: Falha ao ler célula da tabela.")
    url = f"https://api.openweathermap.org/data/2.5/forecast?q={CIDADE}&appid={API_KEY}&units=metric&lang=pt_br"
    try:
        resposta = requests.get(url);
        resposta.raise_for_status();
        dados_api = resposta.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar API do clima: {e}");
        return []
    previsao_diaria = {}
    for dado in dados_api.get("list", []):
        data = datetime.fromtimestamp(dado["dt"]);
        dia_str = data.strftime("%d/%m/%Y")
        if dia_str not in previsao_diaria:
            previsao_diaria[dia_str] = {"dia_semana": dias_semana_pt_completo[data.weekday()], "dia_mes": data.day,
                                        "temp_max": dado["main"]["temp_max"], "temp_min": dado["main"]["temp_min"],
                                        "umidade": dado["main"]["humidity"], "vento": dado["wind"]["speed"] * 3.6,
                                        "chuva_prob": dado.get("pop", 0) * 100,
                                        "status": dado["weather"][0].get("main", "Clear"),
                                        "descricao": dado["weather"][0].get("description", "").capitalize(),
                                        "pulverizacao": dias_pulverizacao.get(dia_str, {"pendente": 0, "concluido": 0})}
        else:
            previsao_diaria[dia_str]["temp_max"] = max(previsao_diaria[dia_str]["temp_max"], dado["main"]["temp_max"])
            previsao_diaria[dia_str]["temp_min"] = min(previsao_diaria[dia_str]["temp_min"], dado["main"]["temp_min"])
    return list(previsao_diaria.values())[:5]


def construir_view_previsao(tabela_lancamentos):
    dados_diarios = buscar_previsao_tempo(tabela_lancamentos)
    if not dados_diarios: return ft.Container(
        content=ft.Text("📡 Não foi possível carregar a previsão.", color=Style.TEXT_LIGHT, size=16),
        alignment=ft.alignment.center, expand=True)
    cards_diarios = []
    for dia in dados_diarios:
        pulv_info = dia["pulverizacao"]
        if pulv_info["pendente"] > 0:
            mensagem_pulv, cor_pulv, icone_pulv = "Pulverização Pendente!", ft.colors.AMBER_ACCENT_700, ft.icons.SPRAY_ROUNDED
        elif pulv_info["concluido"] > 0:
            mensagem_pulv, cor_pulv, icone_pulv = "Pulverização Concluída!", Style.GREEN_COLOR, ft.icons.CHECK_CIRCLE_ROUNDED
        else:
            mensagem_pulv, cor_pulv, icone_pulv = None, None, None
        icone_clima_nome, cor_icone_clima = icones_clima.get(dia["status"], (ft.icons.HELP_ROUNDED, ft.colors.GREY))
        card_content = ft.Column(
            [ft.Text(f"{dia['dia_semana']}", size=16, weight=ft.FontWeight.BOLD, color=Style.TEXT_DARK),
             ft.Text(f"{dia['dia_mes']:02d} {meses_pt[datetime.strptime(f'{dia['dia_mes']:02d}', '%d').month - 1][:3]}",
                     size=12, color=Style.TEXT_LIGHT), ft.Divider(height=10, color="transparent"), ft.Row(
                [ft.Icon(icone_clima_nome, size=48, color=cor_icone_clima),
                 ft.Text(f"{dia['temp_max']:.0f}°", size=32, weight=ft.FontWeight.W_600, color=Style.TEXT_DARK)],
                alignment=ft.MainAxisAlignment.CENTER, spacing=15),
             ft.Text(dia['descricao'], size=12, color=Style.TEXT_LIGHT),
             ft.Text(f"Min: {dia['temp_min']:.0f}°", size=12, color=Style.TEXT_LIGHT), ft.Divider(height=15), ft.Row(
                [ft.Icon(ft.icons.WATER_DROP_OUTLINED, size=14, color=Style.TEXT_LIGHT),
                 ft.Text(f" {dia['chuva_prob']:.0f}%", size=12)], spacing=5), ft.Row(
                [ft.Icon(ft.icons.AIR_ROUNDED, size=14, color=Style.TEXT_LIGHT),
                 ft.Text(f" {dia['vento']:.1f} km/h", size=12)], spacing=5)], spacing=2,
            horizontal_alignment=ft.CrossAxisAlignment.CENTER)
        if mensagem_pulv: card_content.controls.extend([ft.Divider(height=15), ft.Container(
            content=ft.Row([ft.Icon(icone_pulv, size=14), ft.Text(mensagem_pulv, size=12, weight=ft.FontWeight.BOLD)],
                           spacing=8, alignment=ft.MainAxisAlignment.CENTER),
            padding=ft.padding.symmetric(vertical=6, horizontal=10), border_radius=8,
            bgcolor=ft.colors.with_opacity(0.1, cor_pulv))])
        cards_diarios.append(ft.Container(content=card_content, padding=20, border_radius=12, bgcolor=Style.CARD_COLOR,
                                          shadow=ft.BoxShadow(spread_radius=1, blur_radius=5,
                                                              color=ft.colors.with_opacity(0.05, "black")),
                                          expand=True))
    return ft.Column([ft.Text("📡 Previsão do Tempo para os Próximos 5 Dias", size=24, weight=ft.FontWeight.BOLD,
                              color=Style.TEXT_DARK), ft.Row(controls=cards_diarios, spacing=20)], spacing=20)


def construir_view_lancamentos(page: ft.Page, on_data_changed_callback):
    tabela_chuvas = ft.DataTable(columns=[ft.DataColumn(ft.Text("Data")), ft.DataColumn(ft.Text("Pluviômetro")),
                                          ft.DataColumn(ft.Text("mm"), numeric=True), ft.DataColumn(ft.Text("Ações"))],
                                 rows=[], data_row_max_height=45, border=ft.border.all(1, Style.BORDER_COLOR),
                                 border_radius=8)
    campo_data = ft.TextField(label="Data", read_only=True, width=130, dense=True, border_color=Style.BORDER_COLOR)
    date_picker_formulario = CustomDatePicker(campo_data)
    campo_data_row = ft.Row([campo_data, ft.IconButton(icon=ft.icons.CALENDAR_MONTH_ROUNDED,
                                                       on_click=date_picker_formulario.open_picker,
                                                       tooltip="Selecionar Data")], spacing=5)
    campo_local = ft.Dropdown(label="Pluviômetro", options=[ft.dropdown.Option(loc) for loc in locais_coleta],
                              width=220, dense=True, border_color=Style.BORDER_COLOR)
    campo_mm = ft.TextField(label="Milímetros (mm)", keyboard_type=ft.KeyboardType.NUMBER, width=150, dense=True,
                            border_color=Style.BORDER_COLOR)

    def carregar_tabela():
        tabela_chuvas.rows.clear()
        chuvas = sorted(carregar_dados_json(ARQUIVO_CHUVAS_MANUAIS),
                        key=lambda r: datetime.strptime(r['data'], '%d/%m/%Y'), reverse=True)
        for r in chuvas:
            tabela_chuvas.rows.append(ft.DataRow(
                cells=[ft.DataCell(ft.Text(r["data"])), ft.DataCell(ft.Text(r["local"])),
                       ft.DataCell(ft.Text(f"{r['mm']:.1f}")), ft.DataCell(ft.Row([ft.IconButton(
                        icon=ft.icons.EDIT_ROUNDED, icon_size=18, tooltip="Editar", data=r["id"],
                        on_click=lambda e: abrir_dialog_edicao(e.control.data)), ft.IconButton(
                        icon=ft.icons.DELETE_ROUNDED, icon_size=18, tooltip="Excluir", data=r["id"],
                        on_click=lambda e: excluir_registro(e.control.data), icon_color=Style.RED_COLOR)]))]))
        if callable(on_data_changed_callback): on_data_changed_callback()
        if page.controls: page.update()

    campo_edit_data, date_picker_edicao = ft.TextField(label="Data", read_only=True), CustomDatePicker(ft.TextField())
    campo_edit_local, campo_edit_mm = ft.Dropdown(label="Pluviômetro", options=[ft.dropdown.Option(loc) for loc in
                                                                                locais_coleta]), ft.TextField(
        label="mm", keyboard_type=ft.KeyboardType.NUMBER)
    dialog_edicao = ft.AlertDialog(modal=True, title=ft.Text("Editar Registro de Chuva"), content=ft.Column([ft.Row(
        [campo_edit_data,
         ft.IconButton(icon=ft.icons.CALENDAR_MONTH_ROUNDED, on_click=date_picker_edicao.open_picker)]),
        campo_edit_local,
        campo_edit_mm],
        spacing=15),
                                   actions=[ft.TextButton("Cancelar", on_click=lambda e: setattr(dialog_edicao, 'open',
                                                                                                 False) or page.update()),
                                            ft.FilledButton("Salvar Alterações",
                                                            on_click=lambda e: salvar_alteracao(dialog_edicao.data))])

    def abrir_dialog_edicao(registro_id):
        registro = next((r for r in carregar_dados_json(ARQUIVO_CHUVAS_MANUAIS) if r["id"] == registro_id), None)
        if registro:
            dialog_edicao.data = registro_id
            campo_edit_data.value, campo_edit_local.value, campo_edit_mm.value = registro["data"], registro[
                "local"], str(registro["mm"])
            date_picker_edicao.target_textfield = campo_edit_data
            dialog_edicao.open = True;
            page.update()

    def salvar_alteracao(registro_id):
        chuvas = carregar_dados_json(ARQUIVO_CHUVAS_MANUAIS)
        for r in chuvas:
            if r["id"] == registro_id: r.update({"data": campo_edit_data.value, "local": campo_edit_local.value,
                                                 "mm": float(campo_edit_mm.value)}); break
        salvar_dados_json(ARQUIVO_CHUVAS_MANUAIS, chuvas);
        dialog_edicao.open = False;
        carregar_tabela()

    def excluir_registro(registro_id):
        chuvas_mantidas = [r for r in carregar_dados_json(ARQUIVO_CHUVAS_MANUAIS) if r["id"] != registro_id]
        salvar_dados_json(ARQUIVO_CHUVAS_MANUAIS, chuvas_mantidas);
        carregar_tabela()

    def salvar_chuva_manual(e):
        if not all([campo_mm.value, campo_local.value, campo_data.value]):
            page.snack_bar = ft.SnackBar(ft.Text("Preencha todos os campos!"), bgcolor=Style.RED_COLOR)
            page.snack_bar.open = True;
            page.update();
            return
        novo_registro = {"id": datetime.now().strftime("%Y%m%d%H%M%S%f"), "data": campo_data.value,
                         "local": campo_local.value, "mm": float(campo_mm.value)}
        chuvas = carregar_dados_json(ARQUIVO_CHUVAS_MANUAIS);
        chuvas.append(novo_registro)
        salvar_dados_json(ARQUIVO_CHUVAS_MANUAIS, chuvas)
        page.snack_bar = ft.SnackBar(ft.Text("Registro de chuva salvo com sucesso!"), bgcolor=Style.GREEN_COLOR)
        page.snack_bar.open = True;
        campo_data.value, campo_local.value, campo_mm.value = "", None, "";
        carregar_tabela()

    botao_salvar = ft.FilledButton("Adicionar Registro", icon=ft.icons.ADD_ROUNDED, on_click=salvar_chuva_manual,
                                   style=ft.ButtonStyle(bgcolor=Style.PRIMARY_COLOR))
    carregar_tabela()
    page.overlay.extend([date_picker_formulario, date_picker_edicao, dialog_edicao])
    return ft.Column(
        [ft.Text("📋 Lançamentos Manuais de Chuva", size=24, weight=ft.FontWeight.BOLD, color=Style.TEXT_DARK),
         ft.Container(
             content=ft.Row([campo_data_row, campo_local, campo_mm, botao_salvar], alignment=ft.MainAxisAlignment.START,
                            wrap=True, spacing=15, vertical_alignment=ft.CrossAxisAlignment.END), padding=20,
             bgcolor=Style.CARD_COLOR, border_radius=12,
             shadow=ft.BoxShadow(spread_radius=1, blur_radius=5, color=ft.colors.with_opacity(0.05, "black"))),
         ft.Container(content=ft.Column(
             [ft.Text("📜 Histórico de Registros", size=18, weight=ft.FontWeight.BOLD, color=Style.TEXT_DARK),
              ft.Column([tabela_chuvas], scroll=ft.ScrollMode.ADAPTIVE, expand=True)], expand=True), padding=20,
             bgcolor=Style.CARD_COLOR, border_radius=12,
             shadow=ft.BoxShadow(spread_radius=1, blur_radius=5, color=ft.colors.with_opacity(0.05, "black")),
             expand=True)], spacing=20, expand=True)


def construir_view_relatorios(page: ft.Page, on_data_changed_callback):
    df_filtrado_ref = ft.Ref[pd.DataFrame]()
    textos_cards_pluviometros, cards_pluviometros_controls = {}, []
    for i, local in enumerate(locais_coleta):
        texto_valor = ft.Text("0.0 mm", size=24, weight=ft.FontWeight.BOLD, color=ft.colors.WHITE)
        textos_cards_pluviometros[local] = texto_valor
        cards_pluviometros_controls.append(ft.Container(content=ft.Column(
            [ft.Text(local, size=14, weight=ft.FontWeight.W_600, color=ft.colors.WHITE),
             ft.Row([ft.Icon(ft.icons.WATER_DROP, color=ft.colors.WHITE), texto_valor], spacing=5)]), padding=20,
            border_radius=12, expand=True,
            gradient=ft.LinearGradient(begin=ft.alignment.top_left,
                                       end=ft.alignment.bottom_right,
                                       colors=[Style.PRIMARY_COLOR,
                                               ft.colors.BLUE_800])))
    cards_relatorio_pluviometros = ft.Row(controls=cards_pluviometros_controls, spacing=15)
    textos_cards_mensais = {i: ft.Text("0.0", size=18, weight=ft.FontWeight.BOLD, color=Style.TEXT_DARK) for i in
                            range(1, 13)}
    cards_mensais_grid = ft.GridView(expand=False, max_extent=130, runs_count=6, spacing=15, run_spacing=15, height=320)
    for i, nome_mes in enumerate(meses_pt): cards_mensais_grid.controls.append(ft.Container(content=ft.Column(
        [ft.Text(nome_mes.upper(), size=12, weight=ft.FontWeight.BOLD, color=Style.PRIMARY_COLOR), ft.Divider(height=5),
         textos_cards_mensais[i + 1], ft.Text("mm", size=11, color=Style.TEXT_LIGHT)],
        horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=2), padding=15, border_radius=12,
        bgcolor=Style.CARD_COLOR,
        border=ft.border.all(1,
                             Style.BORDER_COLOR)))

    filtro_data_inicio = ft.TextField(label="Data Inicial", read_only=True, width=130, dense=True)
    filtro_data_fim = ft.TextField(label="Data Final", read_only=True, width=130, dense=True)
    date_picker_filtro_inicio, date_picker_filtro_fim = CustomDatePicker(filtro_data_inicio), CustomDatePicker(
        filtro_data_fim)
    anos_disponiveis = [str(y) for y in range(datetime.now().year + 1, 2019, -1)]
    filtro_ano = ft.Dropdown(label="Ano de Referência", options=[ft.dropdown.Option(y) for y in anos_disponiveis],
                             value=str(datetime.now().year), width=200, dense=True,
                             on_change=lambda e: atualizar_todos_relatorios())

    def on_export_pdf(e):
        if df_filtrado_ref.current is not None and not df_filtrado_ref.current.empty:
            gerar_pdf_relatorio_chuva(df_filtrado_ref.current, filtro_data_inicio.value, filtro_data_fim.value,
                                      "relatorio_chuva.pdf", page)
        else:
            page.snack_bar = ft.SnackBar(ft.Text("Aplique um filtro de datas válido para gerar o PDF."),
                                         bgcolor=Style.RED_COLOR);
            page.snack_bar.open = True;
            page.update()

    btn_export_pdf = ft.ElevatedButton("Exportar PDF", icon=ft.icons.PICTURE_AS_PDF_ROUNDED, on_click=on_export_pdf,
                                       style=ft.ButtonStyle(bgcolor=ft.colors.BLUE_GREY_700, color=ft.colors.WHITE))
    btn_atualizar = ft.ElevatedButton("Aplicar Filtros", icon=ft.icons.FILTER_ALT_ROUNDED,
                                      on_click=lambda e: atualizar_todos_relatorios(),
                                      style=ft.ButtonStyle(bgcolor=Style.GREEN_COLOR, color=ft.colors.WHITE))

    filtro_data_row = ft.Row([
        filtro_data_inicio,
        ft.IconButton(icon=ft.icons.CALENDAR_MONTH_ROUNDED, on_click=date_picker_filtro_inicio.open_picker),
        ft.VerticalDivider(),
        filtro_data_fim,
        ft.IconButton(icon=ft.icons.CALENDAR_MONTH_ROUNDED, on_click=date_picker_filtro_fim.open_picker),
        ft.Container(expand=True),
        btn_atualizar,
        btn_export_pdf
    ], spacing=5, vertical_alignment=ft.CrossAxisAlignment.CENTER)

    def atualizar_todos_relatorios():
        chuvas = carregar_dados_json(ARQUIVO_CHUVAS_MANUAIS)
        if not chuvas:  # Se não houver dados, limpa tudo e sai
            df_chuvas = pd.DataFrame(columns=['id', 'data', 'local', 'mm'])
        else:
            df_chuvas = pd.DataFrame(chuvas)

        df_chuvas['data_dt'] = pd.to_datetime(df_chuvas['data'], format='%d/%m/%Y', errors='coerce')
        df_chuvas.dropna(subset=['data_dt'], inplace=True)  # Remove linhas com datas inválidas

        df_filtrado_ref.current = pd.DataFrame()
        if filtro_data_inicio.value and filtro_data_fim.value and not df_chuvas.empty:
            try:
                data_inicio = datetime.strptime(filtro_data_inicio.value, '%d/%m/%Y')
                data_fim = datetime.strptime(filtro_data_fim.value, '%d/%m/%Y')

                chuvas_filtradas = df_chuvas[
                    (df_chuvas['data_dt'] >= data_inicio) & (df_chuvas['data_dt'] <= data_fim)].copy()
                df_filtrado_ref.current = chuvas_filtradas

                total_por_local = chuvas_filtradas.groupby("local")["mm"].sum()
                for local in locais_coleta:
                    textos_cards_pluviometros[local].value = f"{total_por_local.get(local, 0):.1f} mm"
            except (ValueError, TypeError) as e:
                print(f"Erro ao filtrar datas: {e}")
                for local in locais_coleta: textos_cards_pluviometros[local].value = "Data inválida"

        if filtro_ano.value and not df_chuvas.empty:
            df_chuvas_ano = df_chuvas[df_chuvas['data_dt'].dt.year == int(filtro_ano.value)]
            chuvas_portaria = df_chuvas_ano[df_chuvas_ano['local'] == 'Pluviômetro Portaria']
            total_por_mes = chuvas_portaria.groupby(chuvas_portaria['data_dt'].dt.month)['mm'].sum()
            for mes in range(1, 13):
                textos_cards_mensais[mes].value = f"{total_por_mes.get(mes, 0):.1f}"

        if page.controls:
            page.update()

    filtro_data_inicio.value, filtro_data_fim.value = (datetime.now() - timedelta(days=30)).strftime(
        "%d/%m/%Y"), datetime.now().strftime("%d/%m/%Y")
    page.overlay.extend([date_picker_filtro_inicio, date_picker_filtro_fim])
    if callable(on_data_changed_callback): on_data_changed_callback(atualizar_todos_relatorios)
    atualizar_todos_relatorios()

    return ft.Column([
        ft.Text("📊 Relatórios de Precipitação", size=24, weight=ft.FontWeight.BOLD, color=Style.TEXT_DARK),
        ft.Container(content=ft.Column([ft.Text("Acumulado por Pluviômetro no Período", size=18,
                                                weight=ft.FontWeight.W_600, color=Style.TEXT_DARK), filtro_data_row,
                                        ft.Divider(height=10, color='transparent'), cards_relatorio_pluviometros]),
                     padding=20, bgcolor=Style.CARD_COLOR, border_radius=12),
        ft.Container(content=ft.Column([ft.Text("Acumulado Mensal (Pluviômetro Portaria)", size=18,
                                                weight=ft.FontWeight.W_600, color=Style.TEXT_DARK),
                                        ft.Row([filtro_ano]), ft.Divider(height=10, color='transparent'),
                                        cards_mensais_grid]), padding=20, bgcolor=Style.CARD_COLOR, border_radius=12),
    ], spacing=20, scroll=ft.ScrollMode.ADAPTIVE, expand=True)


def clima_page(page: ft.Page, tabela_lancamentos):
    page.bgcolor = Style.BG_COLOR;
    page.padding = 0
    update_reports_func = None

    def set_update_callback(func):
        nonlocal update_reports_func;
        update_reports_func = func

    def on_data_changed():
        if callable(update_reports_func): update_reports_func()

    view_previsao, view_lancamentos, view_relatorios = construir_view_previsao(
        tabela_lancamentos), construir_view_lancamentos(page, on_data_changed), construir_view_relatorios(page,
                                                                                                          set_update_callback)

    main_content = ft.Container(content=None, padding=ft.padding.all(20), expand=True, animate_opacity=300)
    menu_items = []

    def switch_page(selected_item_control, content_to_display, initial_setup=False):
        main_content.content = content_to_display
        for item in menu_items:
            is_selected = item == selected_item_control
            item.bgcolor = ft.colors.with_opacity(0.1, Style.PRIMARY_COLOR) if is_selected else "transparent"
            item.content.controls[0].color = Style.PRIMARY_COLOR if is_selected else Style.TEXT_LIGHT
            item.content.controls[1].color = Style.PRIMARY_COLOR if is_selected else Style.TEXT_LIGHT
        if not initial_setup and page.controls: page.update()

    def create_menu_item(text, icon, content_page):
        item_control = ft.Container(content=ft.Row([ft.Icon(name=icon, color=Style.TEXT_LIGHT),
                                                    ft.Text(text, color=Style.TEXT_LIGHT, weight=ft.FontWeight.W_600,
                                                            size=14)]),
                                    padding=ft.padding.symmetric(vertical=12, horizontal=20), border_radius=8, ink=True,
                                    on_click=lambda e: switch_page(e.control, content_page))
        menu_items.append(item_control);
        return item_control

    sidebar = ft.Container(content=ft.Column([
        ft.Row([ft.Icon(ft.icons.CLOUD_CIRCLE_ROUNDED, color=Style.PRIMARY_COLOR, size=28),
                ft.Text("Clima e Chuva", size=20, weight=ft.FontWeight.BOLD, color=Style.TEXT_DARK)], spacing=10),
        ft.Divider(height=20),
        ft.Text("ANÁLISES", color=Style.TEXT_LIGHT, size=12),
        create_menu_item("Previsão do Tempo", ft.icons.WB_SUNNY_ROUNDED, view_previsao),
        create_menu_item("Lançar Chuva", ft.icons.EDIT_NOTE_ROUNDED, view_lancamentos),
        create_menu_item("Relatórios", ft.icons.INSERT_CHART_ROUNDED, view_relatorios),
    ], spacing=5), width=250, padding=15, bgcolor=Style.SIDEBAR_COLOR,
        shadow=ft.BoxShadow(spread_radius=1, blur_radius=10, color=ft.colors.with_opacity(0.1, "black")))

    switch_page(menu_items[0], view_previsao, initial_setup=True)
    return ft.Row([sidebar, main_content], expand=True, spacing=0, vertical_alignment=ft.CrossAxisAlignment.START)