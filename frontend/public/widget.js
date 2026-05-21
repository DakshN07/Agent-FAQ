(function() {
    // Agent-FAQ Embeddable Web Widget
    const scriptTag = document.currentScript;
    const eventId = scriptTag.getAttribute('data-event-id');
    const apiHost = scriptTag.getAttribute('data-api-host') || 'http://localhost:3000';
    
    if (!eventId) {
        console.error('Agent-FAQ: Missing data-event-id on script tag');
        return;
    }

    let isExpanded = false;
    let sessionId = localStorage.getItem('agent-faq-session');
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('agent-faq-session', sessionId);
    }

    // Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #agent-faq-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        #agent-faq-toggle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #3b82f6;
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        #agent-faq-toggle:hover {
            transform: scale(1.05);
        }
        #agent-faq-chat {
            display: none;
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            max-height: calc(100vh - 100px);
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }
        #agent-faq-chat.open {
            display: flex;
        }
        #agent-faq-header {
            background: #3b82f6;
            color: white;
            padding: 16px;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #agent-faq-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #f9fafb;
        }
        .agent-msg {
            align-self: flex-start;
            background: #e5e7eb;
            color: #1f2937;
            padding: 10px 14px;
            border-radius: 12px;
            border-bottom-left-radius: 4px;
            max-width: 85%;
            font-size: 14px;
            line-height: 1.4;
        }
        .user-msg {
            align-self: flex-end;
            background: #3b82f6;
            color: white;
            padding: 10px 14px;
            border-radius: 12px;
            border-bottom-right-radius: 4px;
            max-width: 85%;
            font-size: 14px;
            line-height: 1.4;
        }
        #agent-faq-input-area {
            padding: 12px;
            background: white;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 8px;
        }
        #agent-faq-input {
            flex: 1;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 20px;
            outline: none;
            font-size: 14px;
        }
        #agent-faq-input:focus {
            border-color: #3b82f6;
        }
        #agent-faq-send {
            background: #3b82f6;
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);

    // Inject HTML
    const container = document.createElement('div');
    container.id = 'agent-faq-widget';
    container.innerHTML = `
        <div id="agent-faq-chat">
            <div id="agent-faq-header">
                <span id="agent-faq-title">FAQ Agent</span>
                <button id="agent-faq-close" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">&times;</button>
            </div>
            <div id="agent-faq-messages">
                <div class="agent-msg">Hi there! How can I help you today?</div>
            </div>
            <div id="agent-faq-input-area">
                <input type="text" id="agent-faq-input" placeholder="Type a question..." />
                <button id="agent-faq-send">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
            </div>
        </div>
        <button id="agent-faq-toggle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        </button>
    `;
    document.body.appendChild(container);

    // Logic
    const toggleBtn = document.getElementById('agent-faq-toggle');
    const closeBtn = document.getElementById('agent-faq-close');
    const chatWindow = document.getElementById('agent-faq-chat');
    const inputEl = document.getElementById('agent-faq-input');
    const sendBtn = document.getElementById('agent-faq-send');
    const messagesEl = document.getElementById('agent-faq-messages');
    const titleEl = document.getElementById('agent-faq-title');

    // Fetch config
    fetch(`${apiHost}/api/widget/settings/${eventId}`)
        .then(r => r.json())
        .then(data => {
            if (data.botName) titleEl.innerText = data.botName;
            // Could apply dynamic colors here
        })
        .catch(console.error);

    const toggleChat = () => {
        isExpanded = !isExpanded;
        chatWindow.className = isExpanded ? 'open' : '';
    };

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    const addMessage = (text, isUser) => {
        const div = document.createElement('div');
        div.className = isUser ? 'user-msg' : 'agent-msg';
        div.innerText = text;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    const sendMessage = async () => {
        const text = inputEl.value.trim();
        if (!text) return;

        addMessage(text, true);
        inputEl.value = '';

        // Typing indicator
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.className = 'agent-msg';
        typingDiv.innerHTML = '<i>Typing...</i>';
        messagesEl.appendChild(typingDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        try {
            const res = await fetch(`${apiHost}/api/widget/chat/${eventId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, userId: sessionId })
            });
            const data = await res.json();
            
            document.getElementById(typingId).remove();
            
            if (data.reply) {
                addMessage(data.reply, false);
            } else {
                addMessage("I couldn't process that right now.", false);
            }
        } catch (err) {
            document.getElementById(typingId).remove();
            addMessage("Network error. Please try again.", false);
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

})();
