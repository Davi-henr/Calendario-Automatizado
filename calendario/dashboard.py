import flet as ft
import pandas as pd
import matplotlib

matplotlib.use("Agg")
import asyncio
from datetime import datetime, timedelta
from fpdf import FPDF
import base64

# --- DADOS MESTRES SIMULADOS (NOVOS) ---
# Em um sistema real, isso viria de um banco de dados ou de um arquivo de configuração.
# Adicionei custos e períodos de carência para cada "receita".
RECEITAS_DATA = {
    "Acaricida 1": {"custo_bomba": 120.50, "carencia_dias": 14},
    "Fungicida A": {"custo_bomba": 250.00, "carencia_dias": 7},
    "Herbicida B": {"custo_bomba": 95.75, "carencia_dias": 30},
    "Oleo Mineral": {"custo_bomba": 75.00, "carencia_dias": 3},
    "Inseticida X": {"custo_bomba": 180.00, "carencia_dias": 10},
    # Adicione mais receitas conforme necessário
}


# --- Funções de Geração de PDF ---
class PDF(FPDF):
    def __init__(self, report_title="Relatório de Pulverizações", *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.report_title = report_title
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        self.set_font("Arial", "B", 20)
        self.cell(0, 12, self.report_title, ln=True, align="C")
        self.set_font("Arial", "", 10)
        self.cell(0, 10, "Fazenda Vale dos Laranjais, Dorival Fortes", ln=True, align="C")
        now = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        self.set_font("Arial", "", 8)
        self.cell(0, 10, f"Emissão: {now}", ln=True, align="R")
        self.ln(2)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), self.w - 10, self.get_y())
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Página {self.page_no()}/{{nb}}", 0, 0, "C")


# --- FUNÇÕES PDF EXISTENTES (SEM ALTERAÇÃO) ---
def gerar_pdf_relatorio(df, file_path, page: ft.Page):
    pdf = PDF(report_title="Relatório de Pulverizações Pendentes")
    pdf.alias_nb_pages()
    pdf.add_page()
    col_widths = [30, 20, 20, 25, 20, 20, 25, 35]
    headers = ["Próx Aplic.", "Dias Venc.", "Quadra", "Receita", "Bombas", "Pés", "Marcha", "Situação"]

    def print_table_header():
        pdf.set_font("Arial", "B", 9)
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, border=1, align="C")
        pdf.ln()

    print_table_header()
    pdf.set_font("Arial", "", 9)
    df_sorted = df.sort_values("Data_Venc_dt", ascending=True)
    for _, row in df_sorted.iterrows():
        if pdf.get_y() > pdf.h - 20:
            pdf.add_page()
            print_table_header()
            pdf.set_font("Arial", "", 9)
        dias_vencer_str = str(int(row["Dias para Vencer"])) if pd.notna(row["Dias para Vencer"]) else ''
        pdf.cell(col_widths[0], 10, str(row["Data_Vencimento"]), border=1, align="C")
        pdf.cell(col_widths[1], 10, dias_vencer_str, border=1, align="C")
        pdf.cell(col_widths[2], 10, str(row["Quadra"]), border=1, align="C")
        pdf.cell(col_widths[3], 10, str(row["Receita"]), border=1, align="C")
        pdf.cell(col_widths[4], 10, str(row["Bombas"]), border=1, align="C")
        pdf.cell(col_widths[5], 10, str(row["Pés"]), border=1, align="C")
        pdf.cell(col_widths[6], 10, str(row["Marcha"]), border=1, align="C")
        pdf.cell(col_widths[7], 10, str(row["Situação"]), border=1, align="C")
        pdf.ln()
    pdf.output(file_path)
    with open(file_path, "rb") as f:
        pdf_bytes = f.read()
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    page.launch_url(f"data:application/pdf;base64,{pdf_b64}")


def gerar_pdf_relatorio_concluidas(df, file_path, page: ft.Page):
    pdf = PDF(report_title="Relatório de Pulverizações Concluídas")
    pdf.alias_nb_pages()
    pdf.add_page()
    col_widths = [30, 40, 30, 25, 25, 45]
    headers = ["Quadra", "Receita", "Data Conclusão", "Bombas", "Pés", "Status"]

    def print_table_header():
        pdf.set_font("Arial", "B", 9)
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, border=1, align="C")
        pdf.ln()

    print_table_header()
    pdf.set_font("Arial", "", 9)
    df_sorted = df.sort_values("Data_Conclusao_dt", ascending=True)
    for _, row in df_sorted.iterrows():
        if pdf.get_y() > pdf.h - 20:
            pdf.add_page()
            print_table_header()
            pdf.set_font("Arial", "", 9)
        pdf.cell(col_widths[0], 10, str(row["Quadra"]), border=1, align="C")
        pdf.cell(col_widths[1], 10, str(row["Receita"]), border=1, align="C")
        pdf.cell(col_widths[2], 10, str(row["Data_Conclusao"]), border=1, align="C")
        pdf.cell(col_widths[3], 10, str(row["Bombas"]), border=1, align="C")
        pdf.cell(col_widths[4], 10, str(row["Pés"]), border=1, align="C")
        status_value = "Concluído"
        pdf.cell(col_widths[5], 10, str(status_value), border=1, align="C")
        pdf.ln()
    pdf.output(file_path)
    with open(file_path, "rb") as f:
        pdf_bytes = f.read()
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    page.launch_url(f"data:application/pdf;base64,{pdf_b64}")


def gerar_pdf_relatorio_atrasadas(df, file_path, page: ft.Page):
    pdf = PDF(report_title="Relatório de Concluídas Atrasadas")
    pdf.alias_nb_pages()
    pdf.add_page()
    col_widths = [25, 25, 25, 25, 30, 25]
    headers = ["Data Venc.", "Data Início", "Data Final", "Quadra", "Receita", "Atraso (dias)"]

    def print_table_header():
        pdf.set_font("Arial", "B", 9)
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, border=1, align="C")
        pdf.ln()

    print_table_header()
    pdf.set_font("Arial", "", 9)
    if 'Data_Venc_dt' not in df.columns:
        df['Data_Venc_dt'] = pd.to_datetime(df['Data_Vencimento'], format="%d/%m/%Y", errors='coerce')
    df_sorted = df.sort_values("Data_Venc_dt", ascending=True)
    for _, row in df_sorted.iterrows():
        if pdf.get_y() > pdf.h - 20:
            pdf.add_page()
            print_table_header()
            pdf.set_font("Arial", "", 9)
        pdf.cell(col_widths[0], 10, str(row["Data_Vencimento"]), border=1, align="C")
        pdf.cell(col_widths[1], 10, str(row.get("Computed_Data_Inicial", "")), border=1, align="C")
        pdf.cell(col_widths[2], 10, str(row.get("Computed_Data_Final", "")), border=1, align="C")
        pdf.cell(col_widths[3], 10, str(row["Quadra"]), border=1, align="C")
        pdf.cell(col_widths[4], 10, str(row["Receita"]), border=1, align="C")
        pdf.cell(col_widths[5], 10, str(row["Computed_Delay"]), border=1, align="C")
        pdf.ln()
    pdf.output(file_path)
    with open(file_path, "rb") as f:
        pdf_bytes = f.read()
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    page.launch_url(f"data:application/pdf;base64,{pdf_b64}")


# --- NOVAS FUNÇÕES DE GERAÇÃO DE PDF ---
def gerar_pdf_relatorio_carencia(df, file_path, page: ft.Page):
    pdf = PDF(report_title="Relatório de Período de Carência")
    pdf.alias_nb_pages()
    pdf.add_page()
    col_widths = [30, 35, 40, 35, 40]
    headers = ["Quadra", "Receita", "Data da Aplicação", "Dias de Carência", "Data de Liberação"]

    def print_table_header():
        pdf.set_font("Arial", "B", 9)
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, border=1, align="C")
        pdf.ln()

    print_table_header()
    pdf.set_font("Arial", "", 9)
    df_sorted = df.sort_values("Data_Liberacao_dt", ascending=True)
    for _, row in df_sorted.iterrows():
        if pdf.get_y() > pdf.h - 20:
            pdf.add_page()
            print_table_header()
            pdf.set_font("Arial", "", 9)
        pdf.cell(col_widths[0], 10, str(row["Quadra"]), border=1, align="C")
        pdf.cell(col_widths[1], 10, str(row["Receita"]), border=1, align="C")
        pdf.cell(col_widths[2], 10, str(row["Data_Conclusao"]), border=1, align="C")
        pdf.cell(col_widths[3], 10, str(int(row["Carencia_Dias"])), border=1, align="C")
        pdf.cell(col_widths[4], 10, str(row["Data_Liberacao"]), border=1, align="C")
        pdf.ln()
    pdf.output(file_path)
    with open(file_path, "rb") as f:
        pdf_bytes = f.read()
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    page.launch_url(f"data:application/pdf;base64,{pdf_b64}")


def gerar_pdf_relatorio_custos(df, file_path, page: ft.Page):
    pdf = PDF(report_title="Relatório de Custos por Talhão")
    pdf.alias_nb_pages()
    pdf.add_page()
    col_widths = [40, 50, 30, 40, 30]
    headers = ["Quadra", "Receita", "Bombas", "Custo (Bomba)", "Custo Total"]

    def print_table_header():
        pdf.set_font("Arial", "B", 10)
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, border=1, align="C")
        pdf.ln()

    print_table_header()
    pdf.set_font("Arial", "", 9)

    # Agrupando e somando os custos por Quadra
    df_custos = df.groupby('Quadra').agg(
        Custo_Total=('Custo_Total', 'sum')
    ).reset_index()

    # Tabela de resumo por quadra
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "Resumo de Custo por Quadra", ln=True, align="L")
    pdf.set_font("Arial", "B", 10)
    pdf.cell(col_widths[0], 10, "Quadra", border=1, align="C")
    pdf.cell(col_widths[1], 10, "Custo Total (R$)", border=1, align="C")
    pdf.ln()
    pdf.set_font("Arial", "", 9)
    for _, row in df_custos.iterrows():
        pdf.cell(col_widths[0], 10, str(row["Quadra"]), border=1, align="C")
        pdf.cell(col_widths[1], 10, f"R$ {row['Custo_Total']:.2f}", border=1, align="C")
        pdf.ln()
    pdf.ln(10)

    # Tabela de detalhes
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "Detalhes das Aplicações", ln=True, align="L")
    print_table_header()  # Re-imprime cabeçalho para a tabela detalhada
    pdf.set_font("Arial", "", 9)
    for _, row in df.iterrows():
        if pdf.get_y() > pdf.h - 20:
            pdf.add_page()
            print_table_header()
            pdf.set_font("Arial", "", 9)

        custo_bomba_str = f"R$ {row['Custo_Bomba']:.2f}"
        custo_total_str = f"R$ {row['Custo_Total']:.2f}"
        pdf.cell(col_widths[0], 10, str(row["Quadra"]), border=1, align="C")
        pdf.cell(col_widths[1], 10, str(row["Receita"]), border=1, align="C")
        pdf.cell(col_widths[2], 10, str(int(row["Bombas_num"])), border=1, align="C")
        pdf.cell(col_widths[3], 10, custo_bomba_str, border=1, align="C")
        pdf.cell(col_widths[4], 10, custo_total_str, border=1, align="C")
        pdf.ln()

    pdf.output(file_path)
    with open(file_path, "rb") as f:
        pdf_bytes = f.read()
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    page.launch_url(f"data:application/pdf;base64,{pdf_b64}")


############################################
# Função principal do Dashboard
############################################
def dashboard_page(page: ft.Page, tabela_lancamentos: ft.Control):
    # --- PALETA DE CORES E ESTILOS ---
    BG_COLOR = "#F8F9FA"
    CARD_COLOR = "#FFFFFF"
    PRIMARY_COLOR = "#4E73DF"
    SIDEBAR_COLOR = "#FFFFFF"
    TEXT_COLOR_DARK = "#343A40"
    TEXT_COLOR_LIGHT = "#6C757D"
    GREEN_COLOR = "#1CC88A"
    RED_COLOR = "#E74A3B"
    ORANGE_COLOR = "#F6C23E"
    BLUE_COLOR = "#36B9CC"
    PURPLE_COLOR = "#6f42c1"  # Nova Cor

    page.bgcolor = BG_COLOR

    # --- PRÉ-PROCESSAMENTO DE DADOS ---
    data_list = []
    if tabela_lancamentos.rows:
        for linha in tabela_lancamentos.rows:
            data_list.append({
                "Bombas": linha.cells[0].content.content.value, "Pés": linha.cells[1].content.content.value,
                "Marcha": linha.cells[2].content.content.value, "Data_Final": linha.cells[3].content.content.value,
                "Quadra": linha.cells[4].content.content.value, "Receita": linha.cells[5].content.content.value,
                "Data_Vencimento": linha.cells[6].content.content.value,
                "Dias para Vencer": linha.cells[7].content.content.value,
                "Situação": linha.cells[8].content.content.value,
                "Data_Conclusao": linha.cells[9].content.content.value,
                "Data_Inicial": linha.record.get("data_inicial", "")
            })

    if not data_list:
        return ft.Column([ft.Text("Nenhum dado para exibir no dashboard.", size=18, color=TEXT_COLOR_DARK)])

    df = pd.DataFrame(data_list)
    df['Bombas_num'] = pd.to_numeric(df['Bombas'], errors='coerce').fillna(0)
    df['Data_Venc_dt'] = pd.to_datetime(df['Data_Vencimento'], format="%d/%m/%Y", errors='coerce')
    df['Data_Conclusao_dt'] = pd.to_datetime(df['Data_Conclusao'], format="%d/%m/%Y", errors='coerce')
    df['Data_Inicial_dt'] = pd.to_datetime(df['Data_Inicial'], format="%d/%m/%Y", errors='coerce')
    df['Dias para Vencer'] = pd.to_numeric(df['Dias para Vencer'], errors='coerce')

    # --- ENRIQUECIMENTO DOS DADOS (NOVO) ---
    # Adicionando dados de custo e carência ao DataFrame principal
    df['Custo_Bomba'] = df['Receita'].apply(lambda x: RECEITAS_DATA.get(x, {}).get('custo_bomba', 0))
    df['Carencia_Dias'] = df['Receita'].apply(lambda x: RECEITAS_DATA.get(x, {}).get('carencia_dias', 0))
    df['Custo_Total'] = df['Bombas_num'] * df['Custo_Bomba']
    df['Data_Liberacao_dt'] = df.apply(
        lambda row: row['Data_Conclusao_dt'] + timedelta(days=row['Carencia_Dias']) if pd.notna(
            row['Data_Conclusao_dt']) else pd.NaT, axis=1)
    df['Data_Liberacao'] = df['Data_Liberacao_dt'].dt.strftime('%d/%m/%Y').fillna('N/A')

    hoje = datetime.now()

    def calc_situacao(row):
        if row['Situação'] != 'Pendente': return row['Situação']
        if pd.isna(row['Data_Venc_dt']): return "Data Inválida"
        diff = (row['Data_Venc_dt'] - hoje).days
        if diff < 0:
            return "Atrasada"
        elif diff <= 1:
            return "Perto de vencer"
        else:
            return "Em dia"

    df['Situação'] = df.apply(calc_situacao, axis=1)

    df_pendente = df[df['Situação'] != 'Concluído'].copy()
    df_concluido = df[df['Situação'] == 'Concluído'].copy()
    atrasadas_df_pendentes = df_pendente[df_pendente['Situação'] == 'Atrasada'].copy()

    # --- CÁLCULO PARA OS CARDS SUPERIORES ---
    total_pendentes = len(df_pendente)
    total_atrasadas = len(atrasadas_df_pendentes)
    custo_total_concluidas = df_concluido['Custo_Total'].sum()
    quadras_em_carencia = len(df_concluido[df_concluido['Data_Liberacao_dt'] >= hoje])

    # --- FUNÇÃO PARA CRIAR OS CARDS DE INFO ---
    def create_info_card(title, value, icon, color, is_currency=False):
        formatted_value = f"R$ {value:,.2f}" if is_currency else str(value)
        return ft.Container(
            content=ft.Row([
                ft.Column([
                    ft.Text(title.upper(), size=11, weight=ft.FontWeight.BOLD, color=color),
                    ft.Text(formatted_value, size=20, weight=ft.FontWeight.BOLD, color=TEXT_COLOR_DARK),
                ], spacing=2, expand=True),
                ft.Icon(name=icon, color=ft.colors.with_opacity(0.5, TEXT_COLOR_LIGHT), size=32),
            ], spacing=20, vertical_alignment=ft.CrossAxisAlignment.CENTER),
            bgcolor=CARD_COLOR, padding=20, border_radius=5,
            border=ft.border.only(left=ft.border.BorderSide(4, color)),
            shadow=ft.BoxShadow(spread_radius=1, blur_radius=5, color=ft.colors.with_opacity(0.05, "black")),
            expand=True,
        )

    # --- ATUALIZAÇÃO DOS CARDS DE INFO ---
    info_cards_row = ft.Row([
        create_info_card("Pendentes", total_pendentes, ft.icons.CALENDAR_MONTH_ROUNDED, PRIMARY_COLOR),
        create_info_card("Atrasadas", total_atrasadas, ft.icons.WARNING_ROUNDED, ORANGE_COLOR),
        create_info_card("Custos (Concluídas)", custo_total_concluidas, ft.icons.MONETIZATION_ON_ROUNDED, GREEN_COLOR,
                         is_currency=True),
        create_info_card("Quadras em Carência", quadras_em_carencia, ft.icons.SECURITY_ROUNDED, RED_COLOR),
    ], spacing=20)

    # --- CONTEÚDO DAS PÁGINAS (RELATÓRIOS E RESUMO) ---
    # Páginas existentes (Resumo, Pendentes, Concluídas, Atrasadas, Média de Bombas)
    # O código original para estas páginas foi mantido com pequenas adaptações.
    # ... (código original das páginas aqui)

    # 1. Página de Resumo
    start_week = (hoje - timedelta(days=hoje.weekday())).date()
    end_week = start_week + timedelta(days=5)
    da_semana_df = df_pendente[(df_pendente['Data_Venc_dt'].dt.date >= start_week) & (
            df_pendente['Data_Venc_dt'].dt.date <= end_week)].copy()
    pool_trabalho_df = pd.concat([atrasadas_df_pendentes, da_semana_df]).drop_duplicates(
        subset=['Quadra', 'Receita', 'Data_Inicial'])
    total_tarefas_pool = len(pool_trabalho_df)
    if not pool_trabalho_df.empty:
        pool_keys = pool_trabalho_df[['Quadra', 'Receita', 'Data_Inicial']].apply(tuple, axis=1)
        concluidas_do_pool = df[df[['Quadra', 'Receita', 'Data_Inicial']].apply(tuple, axis=1).isin(pool_keys) & (
                df['Situação'] == 'Concluído')]
        total_concluidas_pool = len(concluidas_do_pool)
        bombas_pendentes_semana = int(pool_trabalho_df['Bombas_num'].sum())
    else:
        total_concluidas_pool = 0
        bombas_pendentes_semana = 0
    performance_semanal = (total_concluidas_pool / total_tarefas_pool) if total_tarefas_pool > 0 else 0.0

    resumo_page = ft.Column([
        ft.Text("Resumo Semanal", size=24, weight=ft.FontWeight.W_700, color=TEXT_COLOR_DARK),
        ft.Row([
            ft.Container(ft.Column([
                ft.Text("Performance da Semana", size=16, weight=ft.FontWeight.BOLD, color=PRIMARY_COLOR),
                ft.Text(f"{total_concluidas_pool} de {total_tarefas_pool} tarefas concluídas (Atrasadas + Semana)",
                        color=TEXT_COLOR_LIGHT, size=12),
                ft.Text(f"{performance_semanal:.0%}", size=36, weight=ft.FontWeight.W_800),
                ft.ProgressBar(value=performance_semanal, width=None, color=PRIMARY_COLOR, bgcolor="#E0E0E0", height=8),
            ]), expand=True, padding=20, bgcolor=CARD_COLOR, border_radius=5),
            ft.Container(ft.Column([
                ft.Text("Bombas Pendentes", size=16, weight=ft.FontWeight.BOLD, color=PRIMARY_COLOR),
                ft.Text("Soma (Atrasadas + Semana)", color=TEXT_COLOR_LIGHT, size=12),
                ft.Text(str(bombas_pendentes_semana), size=36, weight=ft.FontWeight.W_800),
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER), expand=True, padding=20, bgcolor=CARD_COLOR,
                border_radius=5, alignment=ft.alignment.center)
        ], spacing=20)
    ], spacing=20)

    # 2. Página de Relatório de Pendentes
    header_pendente = ft.Row(
        [ft.Text(h, weight=ft.FontWeight.BOLD, expand=True, text_align=ft.TextAlign.CENTER) for h in
         ["Próx Pulv.", "Quadra", "Receita", "Bombas", "Situação"]])
    body_pendente = ft.ListView(expand=True, spacing=5, padding=0)

    def atualizar_lista_pendente(df_filtrado):
        body_pendente.controls.clear()
        if df_filtrado.empty:
            body_pendente.controls.append(ft.Text("Nenhum registro pendente encontrado."))
        for _, row in df_filtrado.sort_values(by='Data_Venc_dt').iterrows():
            cor_sit = {"Atrasada": RED_COLOR, "Perto de vencer": ORANGE_COLOR, "Em dia": GREEN_COLOR}.get(
                row['Situação'], TEXT_COLOR_DARK)
            body_pendente.controls.append(ft.Container(ft.Row([
                ft.Text(row["Data_Vencimento"], expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(row["Quadra"], expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(row["Receita"], expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(str(int(row["Bombas_num"])), expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(row["Situação"], expand=True, text_align=ft.TextAlign.CENTER, color=cor_sit,
                        weight=ft.FontWeight.BOLD),
            ]), padding=10, border_radius=5, bgcolor=ft.colors.with_opacity(0.03, "black")))
        if body_pendente.page: body_pendente.update()

    atualizar_lista_pendente(df_pendente)
    pendentes_page = ft.Column([
        ft.Row([
            ft.Text("Relatório de Pendentes", size=24, weight=ft.FontWeight.W_700),
            ft.ElevatedButton("Gerar PDF", icon=ft.icons.PICTURE_AS_PDF,
                              on_click=lambda e: gerar_pdf_relatorio(df_pendente, "pendentes.pdf", page))
        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
        ft.Container(ft.Column([header_pendente, ft.Divider(height=5, color="transparent"), body_pendente], expand=True,
                               spacing=5), padding=20, bgcolor=CARD_COLOR, border_radius=5, expand=True)
    ], spacing=20)

    # 3. Página de Relatório de Concluídas (Lógica Simples)
    header_concluidas = ft.Row(
        [ft.Text(h, weight=ft.FontWeight.BOLD, expand=True, text_align=ft.TextAlign.CENTER) for h in
         ["Data Conclusão", "Quadra", "Receita", "Bombas"]])
    body_concluidas = ft.ListView(expand=True, spacing=5, padding=0)

    def atualizar_lista_concluidas(df_filtrado):
        body_concluidas.controls.clear()
        if df_filtrado.empty:
            body_concluidas.controls.append(ft.Text("Nenhum registro encontrado para os filtros aplicados."))
        for _, row in df_filtrado.sort_values(by='Data_Conclusao_dt').iterrows():
            body_concluidas.controls.append(ft.Container(ft.Row([
                ft.Text(row["Data_Conclusao"], expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(row["Quadra"], expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(row["Receita"], expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(str(int(row["Bombas_num"])), expand=True, text_align=ft.TextAlign.CENTER),
            ]), padding=10, border_radius=5, bgcolor=ft.colors.with_opacity(0.03, "black")))
        if body_concluidas.page: body_concluidas.update()

    filtro_data_inicio_concl = ft.TextField(label="Data Início", hint_text="DD/MM/AAAA", width=150)
    filtro_data_fim_concl = ft.TextField(label="Data Fim", hint_text="DD/MM/AAAA", width=150)

    def aplicar_filtros_concluidas(e):
        df_filtrado = df_concluido.copy()
        if filtro_data_inicio_concl.value:
            try:
                start_date = pd.to_datetime(filtro_data_inicio_concl.value, format="%d/%m/%Y")
                df_filtrado = df_filtrado[df_filtrado['Data_Conclusao_dt'] >= start_date]
            except ValueError:
                pass
        if filtro_data_fim_concl.value:
            try:
                end_date = pd.to_datetime(filtro_data_fim_concl.value, format="%d/%m/%Y")
                df_filtrado = df_filtrado[df_filtrado['Data_Conclusao_dt'] <= end_date]
            except ValueError:
                pass
        atualizar_lista_concluidas(df_filtrado)

    atualizar_lista_concluidas(df_concluido)
    concluidas_page = ft.Column([
        ft.Row([
            ft.Text("Relatório de Concluídas", size=24, weight=ft.FontWeight.W_700, color=TEXT_COLOR_DARK),
            ft.ElevatedButton("Gerar PDF", icon=ft.icons.PICTURE_AS_PDF,
                              on_click=lambda e: gerar_pdf_relatorio_concluidas(df_concluido, "concluidas.pdf", page))
        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
        ft.Row([filtro_data_inicio_concl, filtro_data_fim_concl,
                ft.ElevatedButton("Filtrar", icon=ft.icons.FILTER_ALT, on_click=aplicar_filtros_concluidas)]),
        ft.Container(
            ft.Column([header_concluidas, ft.Divider(height=5, color="transparent"), body_concluidas], expand=True,
                      spacing=5), padding=20, bgcolor=CARD_COLOR, border_radius=5, expand=True)
    ], spacing=20)

    # 4. Página de Relatório de Concluídas Atrasadas
    df_para_calculo_atraso = df.copy()
    df_para_calculo_atraso = df_para_calculo_atraso.sort_values(
        by=["Quadra", "Receita", "Data_Inicial_dt"]).reset_index(drop=True)
    df_para_calculo_atraso["Computed_Delay"] = 0
    df_para_calculo_atraso["Computed_Data_Inicial"] = ""
    df_para_calculo_atraso["Computed_Data_Final"] = ""

    for (quadra, receita), group in df_para_calculo_atraso.groupby(["Quadra", "Receita"]):
        group = group.sort_values(by="Data_Inicial_dt").reset_index()
        for i in range(1, len(group)):
            curr = group.loc[i]
            prev = group.loc[i - 1]
            if curr["Situação"] == "Pendente" and prev["Situação"] == "Concluído":
                if pd.notna(curr["Data_Inicial_dt"]) and pd.notna(prev["Data_Venc_dt"]):
                    delay = (curr["Data_Inicial_dt"] - prev["Data_Venc_dt"]).days
                    if delay > 0:
                        df_para_calculo_atraso.at[group.loc[i - 1, "index"], "Computed_Delay"] = delay
                        df_para_calculo_atraso.at[group.loc[i - 1, "index"], "Computed_Data_Inicial"] = curr[
                            "Data_Inicial"]
                        df_para_calculo_atraso.at[group.loc[i - 1, "index"], "Computed_Data_Final"] = curr["Data_Final"]

    atrasadas_df_final = df_para_calculo_atraso[df_para_calculo_atraso["Computed_Delay"] > 0].copy()

    header_atrasadas = ft.Row(
        [ft.Text(h, weight=ft.FontWeight.BOLD, expand=True, text_align=ft.TextAlign.CENTER) for h in
         ["Data Venc.", "Quadra", "Receita", "Atraso (dias)"]])
    body_atrasadas = ft.ListView(expand=True, spacing=5, padding=0)

    if atrasadas_df_final.empty:
        body_atrasadas.controls.append(ft.Container(
            content=ft.Text("Nenhuma tarefa concluída com atraso encontrada.", text_align=ft.TextAlign.CENTER),
            padding=20))
    else:
        for _, row in atrasadas_df_final.sort_values(by='Data_Venc_dt').iterrows():
            body_atrasadas.controls.append(ft.Container(ft.Row([
                ft.Text(row["Data_Vencimento"], expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(row["Quadra"], expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(row["Receita"], expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(str(row.get("Computed_Delay", "N/A")), expand=True, text_align=ft.TextAlign.CENTER,
                        color=RED_COLOR, weight=ft.FontWeight.BOLD)
            ]), padding=10, border_radius=5, bgcolor=ft.colors.with_opacity(0.03, "black")))

    atrasadas_page = ft.Column([
        ft.Row([
            ft.Text("Concluídas com Atraso", size=24, weight=ft.FontWeight.W_700),
            ft.ElevatedButton("Gerar PDF", icon=ft.icons.PICTURE_AS_PDF,
                              on_click=lambda e: gerar_pdf_relatorio_atrasadas(atrasadas_df_final,
                                                                               "concluidas_atrasadas.pdf", page))
        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
        ft.Container(
            ft.Column([header_atrasadas, ft.Divider(height=5, color="transparent"), body_atrasadas], expand=True,
                      spacing=5), padding=20, bgcolor=CARD_COLOR, border_radius=5, expand=True)
    ], spacing=20)

    # 5. Página de Relatório de Média de Bombas
    header_media = ft.Row([ft.Text("Quadra", weight=ft.FontWeight.BOLD, expand=True),
                           ft.Text("Média de Bombas", weight=ft.FontWeight.BOLD, expand=True)])
    body_media = ft.ListView(expand=True, spacing=5, padding=0)

    def atualizar_lista_media(df_filtrado):
        body_media.controls.clear()
        if df_filtrado.empty or df_filtrado['Bombas_num'].sum() == 0:
            body_media.controls.append(ft.Text("Nenhum dado para este filtro."))
        else:
            media_df = df_filtrado.groupby("Quadra")["Bombas_num"].mean().reset_index()
            for _, row in media_df.iterrows():
                body_media.controls.append(ft.Container(ft.Row([
                    ft.Text(row["Quadra"], expand=True),
                    ft.Text(f"{row['Bombas_num']:.1f}", expand=True),
                ]), padding=10, border_radius=5, bgcolor=ft.colors.with_opacity(0.03, "black")))
        if body_media.page: body_media.update()

    opcoes_marcha = ["Todas"] + sorted(df["Marcha"].unique().tolist())
    filtro_marcha = ft.Dropdown(label="Filtrar por Marcha", options=[ft.dropdown.Option(m) for m in opcoes_marcha],
                                value="Todas", width=200)

    def aplicar_filtro_media(e):
        if filtro_marcha.value == "Todas":
            atualizar_lista_media(df)
        else:
            atualizar_lista_media(df[df['Marcha'] == filtro_marcha.value])

    atualizar_lista_media(df)
    media_page = ft.Column([
        ft.Text("Média de Bombas por Quadra", size=24, weight=ft.FontWeight.W_700, color=TEXT_COLOR_DARK),
        ft.Row([filtro_marcha, ft.ElevatedButton("Filtrar", icon=ft.icons.FILTER_ALT, on_click=aplicar_filtro_media)]),
        ft.Container(
            ft.Column([header_media, ft.Divider(height=5, color="transparent"), body_media], expand=True, spacing=5),
            padding=20, bgcolor=CARD_COLOR, border_radius=5, expand=True)
    ], spacing=20)

    # --- NOVAS PÁGINAS DE RELATÓRIO ---

    # 6. Página de Relatório de Carência
    df_carencia_ativo = df_concluido[df_concluido['Data_Liberacao_dt'] >= hoje].copy()
    header_carencia = ft.Row(
        [ft.Text(h, weight=ft.FontWeight.BOLD, expand=True, text_align=ft.TextAlign.CENTER) for h in
         ["Quadra", "Receita", "Data Aplicação", "Data Liberação"]])
    body_carencia = ft.ListView(expand=True, spacing=5, padding=0)

    if df_carencia_ativo.empty:
        body_carencia.controls.append(ft.Container(
            content=ft.Text("Nenhuma quadra em período de carência.", text_align=ft.TextAlign.CENTER), padding=20))
    else:
        for _, row in df_carencia_ativo.sort_values(by='Data_Liberacao_dt').iterrows():
            body_carencia.controls.append(ft.Container(ft.Row([
                ft.Text(row["Quadra"], expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(row["Receita"], expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(row["Data_Conclusao"], expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(row["Data_Liberacao"], expand=True, text_align=ft.TextAlign.CENTER, color=RED_COLOR,
                        weight=ft.FontWeight.BOLD),
            ]), padding=10, border_radius=5, bgcolor=ft.colors.with_opacity(0.03, "black")))

    carencia_page = ft.Column([
        ft.Row([
            ft.Text("Relatório de Carência", size=24, weight=ft.FontWeight.W_700),
            ft.ElevatedButton("Gerar PDF", icon=ft.icons.PICTURE_AS_PDF,
                              on_click=lambda e: gerar_pdf_relatorio_carencia(df_carencia_ativo, "carencia.pdf", page))
        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
        ft.Container(
            ft.Column([header_carencia, ft.Divider(height=5, color="transparent"), body_carencia], expand=True,
                      spacing=5), padding=20, bgcolor=CARD_COLOR, border_radius=5, expand=True)
    ], spacing=20)

    # 7. Página de Relatório de Custos
    df_custos = df_concluido[df_concluido['Custo_Total'] > 0].copy()
    header_custos = ft.Row(
        [ft.Text(h, weight=ft.FontWeight.BOLD, expand=True, text_align=ft.TextAlign.CENTER) for h in
         ["Quadra", "Receita", "Bombas", "Custo Total"]])
    body_custos = ft.ListView(expand=True, spacing=5, padding=0)

    if df_custos.empty:
        body_custos.controls.append(ft.Container(
            content=ft.Text("Nenhum custo registrado para aplicações concluídas.", text_align=ft.TextAlign.CENTER),
            padding=20))
    else:
        # Agregando por quadra para o resumo
        custos_agregados = df_custos.groupby('Quadra')['Custo_Total'].sum().reset_index()
        for _, row in custos_agregados.sort_values(by='Custo_Total', ascending=False).iterrows():
            body_custos.controls.append(ft.Container(ft.Row([
                ft.Text(row["Quadra"], expand=True, text_align=ft.TextAlign.CENTER, weight=ft.FontWeight.BOLD),
                ft.Text("-", expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text("-", expand=True, text_align=ft.TextAlign.CENTER),
                ft.Text(f"R$ {row['Custo_Total']:.2f}", expand=True, text_align=ft.TextAlign.CENTER, color=GREEN_COLOR,
                        weight=ft.FontWeight.BOLD),
            ]), padding=10, border_radius=5, bgcolor=ft.colors.with_opacity(0.05, "black")))

    custos_page = ft.Column([
        ft.Row([
            ft.Text("Relatório de Custos", size=24, weight=ft.FontWeight.W_700),
            ft.ElevatedButton("Gerar PDF Detalhado", icon=ft.icons.PICTURE_AS_PDF,
                              on_click=lambda e: gerar_pdf_relatorio_custos(df_custos, "custos.pdf", page))
        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
        ft.Container(
            ft.Column([header_custos, ft.Divider(height=5, color="transparent"), body_custos], expand=True,
                      spacing=5), padding=20, bgcolor=CARD_COLOR, border_radius=5, expand=True)
    ], spacing=20)

    # --- LÓGICA DO MENU LATERAL E CONTEÚDO PRINCIPAL ---
    main_content = ft.Container(content=resumo_page, padding=ft.padding.only(top=0, right=20, bottom=20, left=20),
                                expand=True, animate_opacity=300)
    menu_items = []

    def switch_page(selected_item_control, content_to_display, initial_setup=False):
        # ***** CORREÇÃO APLICADA AQUI *****
        # Trocado 'page.client_platform == "web"' por 'page.web'
        if page.web:
            # No modo web, usamos asyncio para uma transição mais suave
            async def update_async():
                main_content.opacity = 0
                if not initial_setup:
                    main_content.update()
                    await asyncio.sleep(0.1)

                main_content.content = content_to_display
                for item in menu_items:
                    is_selected = item == selected_item_control
                    item.bgcolor = ft.colors.with_opacity(0.1, PRIMARY_COLOR) if is_selected else "transparent"
                    item.content.controls[0].color = PRIMARY_COLOR if is_selected else TEXT_COLOR_LIGHT
                    item.content.controls[1].color = PRIMARY_COLOR if is_selected else TEXT_COLOR_LIGHT

                main_content.opacity = 1
                if not initial_setup:
                    main_content.update()
                    page.update()

            # Executa a rotina assíncrona
            asyncio.run(update_async())
        else:
            # No modo desktop, a atualização síncrona é mais estável
            main_content.opacity = 0
            if not initial_setup: main_content.update()

            main_content.content = content_to_display
            for item in menu_items:
                is_selected = item == selected_item_control
                item.bgcolor = ft.colors.with_opacity(0.1, PRIMARY_COLOR) if is_selected else "transparent"
                item.content.controls[0].color = PRIMARY_COLOR if is_selected else TEXT_COLOR_LIGHT
                item.content.controls[1].color = PRIMARY_COLOR if is_selected else TEXT_COLOR_LIGHT

            main_content.opacity = 1
            if not initial_setup: main_content.update()
            page.update()

    def create_menu_item(text, icon, content_page):
        item_control = ft.Container(
            content=ft.Row([ft.Icon(name=icon, color=TEXT_COLOR_LIGHT),
                            ft.Text(text, color=TEXT_COLOR_LIGHT, weight=ft.FontWeight.W_600)]),
            padding=ft.padding.symmetric(vertical=12, horizontal=20), border_radius=8, ink=True,
        )
        item_control.on_click = lambda e: switch_page(item_control, content_page)
        menu_items.append(item_control)
        return item_control

    sidebar = ft.Container(
        content=ft.Column([
            ft.Row([ft.Icon(ft.icons.ECO_ROUNDED, color=GREEN_COLOR, size=28),
                    ft.Text("Citrus Control", size=20, weight=ft.FontWeight.BOLD, color=TEXT_COLOR_DARK)]),
            ft.Divider(height=20),
            ft.Text("GERAL", color=TEXT_COLOR_LIGHT, size=12),
            create_menu_item("Resumo", ft.icons.DASHBOARD_ROUNDED, resumo_page),
            ft.Text("RELATÓRIOS", color=TEXT_COLOR_LIGHT, size=12),
            create_menu_item("Pendentes", ft.icons.CALENDAR_MONTH_ROUNDED, pendentes_page),
            create_menu_item("Concluídas", ft.icons.CHECKLIST_ROUNDED, concluidas_page),
            create_menu_item("Concluídas Atrasadas", ft.icons.HISTORY_ROUNDED, atrasadas_page),
            # --- NOVOS ITENS DE MENU ---
            create_menu_item("Período de Carência", ft.icons.SHIELD_ROUNDED, carencia_page),
            create_menu_item("Análise de Custos", ft.icons.ATTACH_MONEY_ROUNDED, custos_page),
            ft.Divider(height=10, color="transparent"),
            ft.Text("ANÁLISES", color=TEXT_COLOR_LIGHT, size=12),
            create_menu_item("Média de Bombas", ft.icons.QUERY_STATS_ROUNDED, media_page),
        ], spacing=5),
        width=250, padding=15, bgcolor=SIDEBAR_COLOR,
    )

    switch_page(menu_items[0], resumo_page, initial_setup=True)

    layout = ft.Column([
        info_cards_row,
        ft.Row([sidebar, main_content], expand=True, spacing=20, vertical_alignment=ft.CrossAxisAlignment.START),
    ], expand=True, spacing=20, scroll=ft.ScrollMode.ADAPTIVE)

    return layout