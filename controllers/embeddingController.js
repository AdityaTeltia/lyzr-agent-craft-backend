const Agent = require('../models/agent');

const generateEmbeddingScript = async (req, res) => {
    const { agentId } = req.params;

    try {
        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(404).send('Agent not found');
        }

        const script = `
(function() {
    const CHAT_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';
    const LOG_CHAT_URL = '${process.env.BASE_API_URL || ""}/api/chat/log-chat';

    let sessionId = '${agentId}-' + Math.random().toString(36).substring(2);
    const userEmail = 'user@' + window.location.hostname;

    let inactivityTimer = null;
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    function resetInactivityTimer() {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            logChat('System', 'Ticket closed due to inactivity');
        }, INACTIVITY_TIMEOUT);
    }

    const style = document.createElement('style');
    style.innerHTML = \`
        .lyzr-chat-button {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #111827;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 14px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        }

        .lyzr-chat-button:hover {
            transform: scale(1.05);
        }

        .lyzr-chat-window {
            position: fixed;
            bottom: 90px;
            right: 24px;
            width: 360px;
            height: 580px;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            z-index: 9998;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: none;
        }

        .lyzr-chat-header {
            padding: 16px;
            background: #111827;
            color: #fff;
            font-weight: 600;
            font-size: 16px;
        }

        .lyzr-chat-body {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #f9fafb;
        }

        .lyzr-chat-footer {
            padding: 12px;
            border-top: 1px solid #e5e7eb;
            background: #fff;
        }

        .lyzr-chat-input {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid #d1d5db;
            border-radius: 9999px;
            outline: none;
            font-size: 14px;
        }

        .lyzr-message {
            padding: 10px 14px;
            margin-bottom: 12px;
            border-radius: 16px;
            max-width: 75%;
            font-size: 14px;
            line-height: 1.4;
            word-break: break-word;
        }

        .lyzr-user-message {
            background: #111827;
            color: #fff;
            align-self: flex-end;
            margin-left: auto;
        }

        .lyzr-agent-message {
            background: #e5e7eb;
            color: #111827;
            align-self: flex-start;
        }

        .lyzr-powered {
            font-size: 12px;
            text-align: center;
            padding: 4px;
            color: #9ca3af;
            background: #f3f4f6;
        }
    \`;
    document.head.appendChild(style);

    const chatBtn = document.createElement('div');
    chatBtn.className = 'lyzr-chat-button';
    chatBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-message-circle"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-3.8-11.4"></path><path d="M8 10h.01"></path><path d="M12 10h.01"></path><path d="M16 10h.01"></path></svg>';

    const chatWindow = document.createElement('div');
    chatWindow.className = 'lyzr-chat-window';
    chatWindow.innerHTML = \`
        <div class="lyzr-chat-header">
            ${agent.name} - Ask me anything!
        </div>
        <div class="lyzr-chat-body"></div>
        <div class="lyzr-chat-footer">
            <input type="text" class="lyzr-chat-input" placeholder="Ask a question...">
        </div>
        <div class="lyzr-powered">Powered by Lyzr</div>
    \`;

    document.body.appendChild(chatBtn);
    document.body.appendChild(chatWindow);

    const chatBody = chatWindow.querySelector('.lyzr-chat-body');
    const input = chatWindow.querySelector('.lyzr-chat-input');

    chatBtn.addEventListener('click', () => {
        chatWindow.style.display = chatWindow.style.display === 'none' || !chatWindow.style.display ? 'flex' : 'none';
    });

    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && this.value.trim()) {
            const message = this.value.trim();
            this.value = '';
            appendMessage(message, 'user');
            logChat('user', message);
            sendMessageToLyzr(message);
            resetInactivityTimer();
        }
    });

    function appendMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = 'lyzr-message lyzr-' + sender + '-message';
        msg.textContent = text;
        chatBody.appendChild(msg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    async function logChat(sender, message) {
        try {
            console.log(sender)
            console.log(message);
            await fetch(LOG_CHAT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    agentId: '${agentId}',
                    userId: userEmail,
                    sender,
                    message,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (err) {
            console.error('Log Chat Error:', err);
        }
    }

    async function sendMessageToLyzr(text) {
        try {
            // const res = await fetch(CHAT_API_URL, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'x-api-key': '${process.env.LYZR_API_KEY}'
            //     },
            //     body: JSON.stringify({
            //         user_id: userEmail,
            //         agent_id: '${agentId}',
            //         session_id: sessionId,
            //         message: text,
            //         system_prompt_variables: {},
            //         filter_variables: {}
            //     })
            // });
            // const data = await res.json();
            const data = {
                "response": "hello hanji namaste",
            };
            if (data.response) {
                appendMessage(data.response, 'agent');
                logChat('agent', data.response);
            }
            if (data.session_id) sessionId = data.session_id;
        } catch (err) {
            console.error('Lyzr Error:', err);
            appendMessage('Sorry, something went wrong.', 'agent');
        }
    }

    

    resetInactivityTimer();
})();
        `;

        res.type('application/javascript').send(script);
    } catch (error) {
        console.error('[Embedding Error]', error);
        res.status(500).send('Server error');
    }
};

module.exports = { generateEmbeddingScript };
