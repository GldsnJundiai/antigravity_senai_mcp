document.addEventListener('DOMContentLoaded', () => {
    // --- Terminal Interactive Emulator ---
    const terminalBody = document.getElementById('terminal-body');
    const terminalInput = document.getElementById('terminal-input');
    
    // Command History
    const commandHistory = [];
    let historyIndex = -1;

    // Command Handlers
    const commands = {
        'help': () => {
            return [
                'Comandos Disponíveis:',
                '  help         - Exibe esta lista de ajuda',
                '  clear        - Limpa a tela do terminal',
                '  mcp-list     - Lista os servidores MCP configurados no ambiente',
                '  mcp-status   - Mostra o status detalhado da conexão do github-mcp-server',
                '  mcp-run      - Simula a execução de uma ferramenta MCP (ex: mcp-run create_repo)',
                '  git-status   - Exibe o status do repositório Git local'
            ];
        },
        'clear': () => {
            terminalBody.innerHTML = '';
            return null;
        },
        'mcp-list': () => {
            return [
                'Buscando servidores MCP ativos...',
                '---------------------------------------------',
                '● [Servidor] github-mcp-server (ATIVO)',
                '  ├─ Caminho: npx -y @modelcontextprotocol/server-github',
                '  ├─ Protocolo: stdio JSON-RPC 2.0',
                '  └─ Ferramentas Registradas: 12 ferramentas (search_repos, create_repo, etc.)',
                '---------------------------------------------'
            ];
        },
        'mcp-status': () => {
            return [
                'Iniciando handshake com github-mcp-server...',
                '  [OK] Cliente MCP -> Servidor: chamando "initialize"',
                '  [OK] Servidor -> Cliente MCP: "initialize" respondeu com sucesso',
                'Status da Conexão: CONECTADO',
                'Credencial ativa: GitHub Personal Access Token (configurado em mcp_config.json)',
                'Limites de taxa (Rate Limit): 4999 / 5000 requisições restantes'
            ];
        },
        'mcp-run': (args) => {
            if (!args || args.length === 0) {
                return [
                    'Uso do comando: mcp-run <nome_ferramenta>',
                    'Ferramentas simuladas disponíveis:',
                    '  mcp-run create_repo     - Cria o repositório antigravity_senai_mcp no GitHub',
                    '  mcp-run list_repos      - Lista repositórios do usuário autenticado'
                ];
            }
            const subCommand = args[0].toLowerCase();
            if (subCommand === 'create_repo') {
                return [
                    'Chamando ferramenta: github-mcp-server/create_repository',
                    'Enviando argumentos: { name: "antigravity_senai_mcp", private: false }',
                    'Aguardando resposta da API do GitHub...',
                    '  [Sucesso] HTTP/2 201 Created',
                    '  Node ID: R_kgDOTAONkg',
                    '  URL: https://github.com/GldsnJundiai/antigravity_senai_mcp',
                    'Repositório criado e vinculado com sucesso!'
                ];
            } else if (subCommand === 'list_repos') {
                return [
                    'Chamando ferramenta: github-mcp-server/list_repositories',
                    'Autenticando e buscando dados...',
                    '  [Sucesso] HTTP/2 200 OK',
                    'Repositórios encontrados:',
                    '  - GldsnJundiai/CursoJavaSenai',
                    '  - GldsnJundiai/DashboardEtec',
                    '  - GldsnJundiai/antigravity_senai_mcp (Novo!)'
                ];
            } else {
                return [`Ferramenta MCP "${args[0]}" não simulada. Tente: mcp-run create_repo`];
            }
        },
        'git-status': () => {
            return [
                'No ramo principal (branch main)',
                'Sua ramificação está atualizada com \'origin/main\'.',
                'Modificações não rastreadas para o commit:',
                '  (utilize "git add <arquivo>..." para incluir no commit)',
                '	new file:   index.html',
                '	new file:   style.css',
                '	new file:   script.js',
                '	new file:   assets/hero.png',
                'nada adicionado ao commit, mas arquivos não rastreados presentes.'
            ];
        }
    };

    // Output writer helper
    function writeToTerminal(lines, isInput = false, rawCommand = '') {
        if (!lines) return;

        // If it's a command input line
        if (isInput) {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'terminal-line';
            lineDiv.innerHTML = `<span class="prompt">senai-mcp:~$</span> <span>${rawCommand}</span>`;
            terminalBody.appendChild(lineDiv);
            return;
        }

        // If it's output lines
        lines.forEach(line => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'terminal-line';
            
            // Format colors based on text content
            if (line.includes('[Sucesso]') || line.includes('[OK]') || line.includes('CONECTADO') || line.includes('Servidor MCP ativo')) {
                lineDiv.className += ' text-success';
            } else if (line.includes('[Servidor]') || line.includes('Comandos Disponíveis:')) {
                lineDiv.className += ' text-primary';
            } else if (line.includes('├─') || line.includes('└─') || line.includes('●')) {
                lineDiv.className += ' text-secondary';
            } else if (line.includes('Uso do comando:') || line.includes('não simulada')) {
                lineDiv.className += ' text-danger';
            }

            lineDiv.textContent = line;
            terminalBody.appendChild(lineDiv);
        });

        // Scroll to the bottom of the terminal
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // Input handler
    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const rawValue = terminalInput.value;
            const trimmedValue = rawValue.trim();
            terminalInput.value = '';

            if (trimmedValue === '') return;

            // Save to history
            commandHistory.push(rawValue);
            historyIndex = commandHistory.length;

            // Output command typed
            writeToTerminal(null, true, rawValue);

            // Parse command and args
            const parts = trimmedValue.split(/\s+/);
            const cmd = parts[0].toLowerCase();
            const args = parts.slice(1);

            // Execute command
            if (commands[cmd]) {
                const output = commands[cmd](args);
                writeToTerminal(output);
            } else {
                writeToTerminal([
                    `comando não encontrado: ${cmd}`,
                    'Digite "help" para ver a lista de comandos disponíveis.'
                ]);
            }
        } else if (e.key === 'ArrowUp') {
            // Traverse history up
            if (historyIndex > 0) {
                historyIndex--;
                terminalInput.value = commandHistory[historyIndex];
            }
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            // Traverse history down
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                terminalInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                terminalInput.value = '';
            }
            e.preventDefault();
        }
    });

    // Handle terminal focus
    const terminalContainer = document.querySelector('.terminal-container');
    terminalContainer.addEventListener('click', () => {
        terminalInput.focus();
    });

    // --- Newsletter Form Handling ---
    const newsletterForm = document.getElementById('newsletter-form');
    const newsletterEmail = document.getElementById('newsletter-email');
    const newsletterMessage = document.getElementById('newsletter-message');

    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterEmail.value;

        // Visual simulation of success
        newsletterMessage.textContent = 'Enviando...';
        newsletterMessage.style.color = 'var(--text-secondary)';

        setTimeout(() => {
            newsletterMessage.textContent = 'Obrigado por se inscrever! Fique atento ao seu e-mail.';
            newsletterMessage.style.color = 'var(--success-color)';
            newsletterEmail.value = '';
        }, 1200);
    });
});
