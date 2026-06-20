import asyncio
import os
import subprocess
import time
from playwright.async_api import async_playwright

async def run_test():
    log_messages = []
    
    def log(message):
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        msg = f"[{timestamp}] {message}"
        print(msg)
        log_messages.append(msg)

    # Create logs/video folder
    video_dir = "/root/test_videos"
    os.makedirs(video_dir, exist_ok=True)
    
    log("Iniciando o servidor HTTP local na porta 8000...")
    # Start local HTTP server
    server_process = subprocess.Popen(
        ["python3", "-m", "http.server", "8000", "--directory", "/root/antigravity_senai_mcp"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    # Wait for server to start
    await asyncio.sleep(2)
    
    log("Iniciando o Playwright e abrindo navegador Chromium...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Enable video recording
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=video_dir,
            record_video_size={"width": 1280, "height": 720}
        )
        
        page = await context.new_page()
        
        url = "http://localhost:8000"
        log(f"Navegando para a página: {url}")
        await page.goto(url)
        await page.wait_for_timeout(1000)
        
        # Test 1: Verify title and initial theme
        log("Teste 1: Verificando título e tema inicial (Dark Mode)...")
        title = await page.title()
        log(f"Título da página: '{title}'")
        body_class = await page.evaluate("document.body.className")
        log(f"Classe inicial da tag body: '{body_class}' (vazia = Dark Mode padrão)")
        
        # Test 2: Click theme toggle to Light Mode
        log("Teste 2: Clicando no botão de alternar tema (Dark -> Light)...")
        theme_btn = page.locator("#theme-toggle")
        await theme_btn.click()
        await page.wait_for_timeout(1000)
        
        body_class = await page.evaluate("document.body.className")
        log(f"Classe da tag body após clique: '{body_class}'")
        if "light-theme" in body_class:
            log("  [SUCESSO] Modo Light ativo com sucesso!")
        else:
            log("  [ERRO] Modo Light não foi ativado.")
            
        # Toggle back to Dark Mode
        log("Clicando no botão de alternar tema novamente (Light -> Dark)...")
        await theme_btn.click()
        await page.wait_for_timeout(1000)
        body_class = await page.evaluate("document.body.className")
        log(f"Classe da tag body após segundo clique: '{body_class}' (deve estar vazia)")
        
        # Test 3: Interact with terminal simulator
        log("Teste 3: Interagindo com o Simulador de Terminal MCP...")
        terminal_input = page.locator("#terminal-input")
        
        # Type "help"
        log("Digitando 'help' no terminal...")
        await terminal_input.fill("help")
        await terminal_input.press("Enter")
        await page.wait_for_timeout(1500)
        
        # Type "mcp-list"
        log("Digitando 'mcp-list' no terminal...")
        await terminal_input.fill("mcp-list")
        await terminal_input.press("Enter")
        await page.wait_for_timeout(1500)

        # Type "mcp-status"
        log("Digitando 'mcp-status' no terminal...")
        await terminal_input.fill("mcp-status")
        await terminal_input.press("Enter")
        await page.wait_for_timeout(1500)

        # Type "git-status"
        log("Digitando 'git-status' no terminal...")
        await terminal_input.fill("git-status")
        await terminal_input.press("Enter")
        await page.wait_for_timeout(1500)
        
        # Verify terminal lines
        terminal_lines = await page.locator("#terminal-body .terminal-line").all_inner_texts()
        log(f"Total de linhas impressas no terminal: {len(terminal_lines)}")
        log("Últimas linhas do terminal:")
        for line in terminal_lines[-4:]:
            log(f"  > {line.strip()}")
            
        # Test 4: Newsletter signup form
        log("Teste 4: Preenchendo o formulário de newsletter...")
        email_input = page.locator("#newsletter-email")
        submit_btn = page.locator("#btn-submit-newsletter")
        
        test_email = "aluno_senai@sp.senai.br"
        log(f"Digitando e-mail: '{test_email}'")
        await email_input.fill(test_email)
        await page.wait_for_timeout(500)
        
        log("Enviando o formulário...")
        await submit_btn.click()
        
        # Wait for success message
        await page.wait_for_selector("#newsletter-message:has-text('Obrigado')")
        success_msg = await page.locator("#newsletter-message").inner_text()
        log(f"Mensagem de feedback do formulário: '{success_msg}'")
        
        # Wait and close
        await page.wait_for_timeout(2000)
        log("Fechando navegador...")
        
        video_path = await page.video.path()
        log(f"Gravação de tela salva temporariamente em: {video_path}")
        
        await context.close()
        await browser.close()
        
        # Copy the video file to target location
        target_video_path = "/root/.gemini/antigravity-ide/brain/bde8162d-da86-4408-ae11-908cc83138df/test_recording.webm"
        log(f"Copiando gravação para local permanente: {target_video_path}")
        os.rename(video_path, target_video_path)
        
    log("Parando o servidor HTTP local...")
    server_process.terminate()
    server_process.wait()
    
    # Save detailed log to target location
    target_log_path = "/root/.gemini/antigravity-ide/brain/bde8162d-da86-4408-ae11-908cc83138df/test_log.txt"
    log(f"Salvando log detalhado em: {target_log_path}")
    with open(target_log_path, "w", encoding="utf-8") as f:
        f.write("\n".join(log_messages))
        
    log("Teste finalizado com sucesso!")

if __name__ == "__main__":
    asyncio.run(run_test())
