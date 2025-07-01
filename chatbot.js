// AI Financial Advisor Chatbot
export class FinancialAdvisorBot {
    constructor(userProfile, expenses, portfolio) {
        this.userProfile = userProfile;
        this.expenses = expenses;
        this.portfolio = portfolio;
        this.conversationHistory = [];
        this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
    }

    // Initialize chatbot UI
    initChatbot() {
        this.createChatbotUI();
        this.bindEventListeners();
        this.showWelcomeMessage();
    }

    createChatbotUI() {
        const chatbotHTML = `
            <div id="chatbot-container" class="chatbot-container">
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <i class="fas fa-robot"></i>
                        <span>AI Financial Advisor</span>
                    </div>
                    <button id="chatbot-toggle" class="chatbot-toggle">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
                <div id="chatbot-messages" class="chatbot-messages">
                    <!-- Messages will be added here -->
                </div>
                <div class="chatbot-input-area">
                    <div class="quick-actions">
                        <button class="quick-action" data-action="budget-analysis">📊 Budget Analysis</button>
                        <button class="quick-action" data-action="investment-advice">📈 Investment Tips</button>
                        <button class="quick-action" data-action="savings-plan">💰 Savings Plan</button>
                        <button class="quick-action" data-action="expense-tips">💸 Reduce Expenses</button>
                    </div>
                    <div class="input-container">
                        <input type="text" id="chatbot-input" placeholder="Ask me about your finances..." maxlength="500">
                        <button id="chatbot-send" disabled>
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
            <button id="chatbot-launcher" class="chatbot-launcher">
                <i class="fas fa-comments"></i>
                <span class="chatbot-notification">1</span>
            </button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    bindEventListeners() {
        const launcher = document.getElementById('chatbot-launcher');
        const container = document.getElementById('chatbot-container');
        const toggle = document.getElementById('chatbot-toggle');
        const input = document.getElementById('chatbot-input');
        const sendBtn = document.getElementById('chatbot-send');
        const quickActions = document.querySelectorAll('.quick-action');

        launcher.addEventListener('click', () => {
            container.style.display = container.style.display === 'flex' ? 'none' : 'flex';
            if (container.style.display === 'flex') {
                document.querySelector('.chatbot-notification').style.display = 'none';
                input.focus();
            }
        });

        toggle.addEventListener('click', () => {
            const messages = document.getElementById('chatbot-messages');
            const inputArea = document.querySelector('.chatbot-input-area');
            const isMinimized = messages.style.display === 'none';
            
            messages.style.display = isMinimized ? 'flex' : 'none';
            inputArea.style.display = isMinimized ? 'block' : 'none';
            toggle.innerHTML = isMinimized ? '<i class="fas fa-minus"></i>' : '<i class="fas fa-plus"></i>';
        });

        input.addEventListener('input', (e) => {
            sendBtn.disabled = e.target.value.trim().length === 0;
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !sendBtn.disabled) {
                this.handleUserMessage(input.value.trim());
                input.value = '';
                sendBtn.disabled = true;
            }
        });

        sendBtn.addEventListener('click', () => {
            if (!sendBtn.disabled) {
                this.handleUserMessage(input.value.trim());
                input.value = '';
                sendBtn.disabled = true;
            }
        });

        quickActions.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    showWelcomeMessage() {
        const welcomeMessage = `
            👋 Hi there! I'm your AI Financial Advisor. I'm here to help you make smarter financial decisions.

            I can help you with:
            • Budget analysis and optimization
            • Investment recommendations
            • Savings strategies
            • Expense reduction tips
            • Financial planning advice

            What would you like to know about your finances today?
        `;
        
        setTimeout(() => {
            this.addMessage('bot', welcomeMessage);
        }, 1000);
    }

    async handleUserMessage(message) {
        this.addMessage('user', message);
        this.conversationHistory.push({ role: 'user', content: message });

        // Show typing indicator
        this.showTypingIndicator();

        try {
            let response;
            
            // Check if we have OpenAI API key for advanced responses
            if (this.apiKey) {
                response = await this.getAIResponse(message);
            } else {
                response = this.getLocalResponse(message);
            }

            this.hideTypingIndicator();
            this.addMessage('bot', response);
            this.conversationHistory.push({ role: 'assistant', content: response });
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('bot', "I'm having trouble processing your request right now. Please try again later or use the quick action buttons below.");
        }
    }

    async getAIResponse(message) {
        const financialContext = this.generateFinancialContext();
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional financial advisor chatbot for a budget tracking app. 
                        
                        User's Financial Context:
                        ${financialContext}
                        
                        Provide helpful, personalized financial advice based on their data. Keep responses concise (under 200 words), practical, and encouraging. Use emojis occasionally. Focus on actionable advice.`
                    },
                    ...this.conversationHistory.slice(-10), // Keep last 10 messages for context
                    { role: 'user', content: message }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    }

    getLocalResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Pattern matching for common financial questions
        if (lowerMessage.includes('budget') || lowerMessage.includes('spending')) {
            return this.getBudgetAnalysis();
        } else if (lowerMessage.includes('invest') || lowerMessage.includes('portfolio')) {
            return this.getInvestmentAdvice();
        } else if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
            return this.getSavingsAdvice();
        } else if (lowerMessage.includes('expense') || lowerMessage.includes('reduce')) {
            return this.getExpenseReductionTips();
        } else if (lowerMessage.includes('goal') || lowerMessage.includes('plan')) {
            return this.getGoalPlanningAdvice();
        } else {
            return this.getGeneralAdvice();
        }
    }

    handleQuickAction(action) {
        let response = '';
        let userMessage = '';

        switch (action) {
            case 'budget-analysis':
                userMessage = 'Can you analyze my budget?';
                response = this.getBudgetAnalysis();
                break;
            case 'investment-advice':
                userMessage = 'Give me some investment advice';
                response = this.getInvestmentAdvice();
                break;
            case 'savings-plan':
                userMessage = 'Help me create a savings plan';
                response = this.getSavingsAdvice();
                break;
            case 'expense-tips':
                userMessage = 'How can I reduce my expenses?';
                response = this.getExpenseReductionTips();
                break;
        }

        this.addMessage('user', userMessage);
        
        setTimeout(() => {
            this.addMessage('bot', response);
        }, 500);
    }

    getBudgetAnalysis() {
        const currentMonth = new Date().getMonth();
        const monthExpenses = this.expenses[currentMonth] || {};
        const totalExpenses = Object.values(monthExpenses).reduce((sum, exp) => sum + exp.total, 0);
        const budgetUsage = ((totalExpenses / this.userProfile.income) * 100).toFixed(1);
        const remaining = this.userProfile.income - totalExpenses;

        return `📊 **Budget Analysis for This Month:**

💰 Income: $${this.userProfile.income.toFixed(2)}
💸 Spent: $${totalExpenses.toFixed(2)} (${budgetUsage}% of income)
💵 Remaining: $${remaining.toFixed(2)}

${budgetUsage > 80 ? 
    '⚠️ **Alert**: You\'ve used over 80% of your budget! Consider reducing non-essential expenses.' :
    budgetUsage > 60 ?
    '😊 **Good**: You\'re on track with your spending. Keep monitoring!' :
    '🎉 **Excellent**: Great job staying within budget! Consider investing the surplus.'
}

${remaining > 0 ? `💡 **Tip**: With $${remaining.toFixed(2)} remaining, consider putting some towards your savings goal!` : ''}`;
    }

    getInvestmentAdvice() {
        const totalInvested = this.portfolio.totalInvested || 0;
        const monthlyGoal = this.userProfile.portfolioGoal || 0;
        const currentValue = this.portfolio.currentValue || 0;
        const gains = currentValue - totalInvested;

        return `📈 **Investment Insights:**

💼 Portfolio Value: $${currentValue.toFixed(2)}
💰 Total Invested: $${totalInvested.toFixed(2)}
📊 Gains/Loss: ${gains >= 0 ? '+' : ''}$${gains.toFixed(2)}

${totalInvested === 0 ? 
    '🚀 **Get Started**: Consider starting with low-cost ETFs or index funds. Even $50/month can grow significantly over time!' :
    totalInvested < this.userProfile.income * 3 ?
    '📈 **Keep Growing**: Aim to invest 10-20% of your income regularly. Dollar-cost averaging reduces risk!' :
    '🎯 **Well Done**: You have a solid investment foundation. Consider diversifying across different asset types.'
}

💡 **Pro Tips**:
• Diversify across different investment types
• Don't try to time the market
• Invest for the long term (5+ years)
• Review and rebalance quarterly`;
    }

    getSavingsAdvice() {
        const savingsTarget = (this.userProfile.income * this.userProfile.savingsGoal) / 100;
        const currentMonth = new Date().getMonth();
        const monthExpenses = this.expenses[currentMonth] || {};
        const totalExpenses = Object.values(monthExpenses).reduce((sum, exp) => sum + exp.total, 0);
        const currentSavings = this.userProfile.income - totalExpenses;

        return `💰 **Savings Strategy:**

🎯 Monthly Goal: $${savingsTarget.toFixed(2)} (${this.userProfile.savingsGoal}% of income)
💵 Current Progress: $${Math.max(0, currentSavings).toFixed(2)}

${currentSavings >= savingsTarget ?
    '🌟 **Amazing**: You\'re meeting your savings goal! Consider increasing it or investing the extra.' :
    '💪 **Action Plan**: Here\'s how to reach your goal:'
}

📋 **Savings Tips**:
• Automate savings - pay yourself first
• Use the 50/30/20 rule (needs/wants/savings)
• Cut one unnecessary subscription
• Cook at home more often
• Set up a separate savings account

🏆 **Emergency Fund**: Aim for 3-6 months of expenses ($${(totalExpenses * 4).toFixed(2)}) for financial security.`;
    }

    getExpenseReductionTips() {
        const currentMonth = new Date().getMonth();
        const monthExpenses = this.expenses[currentMonth] || {};
        
        let tips = '💸 **Smart Ways to Reduce Expenses:**\n\n';
        
        // Analyze spending categories
        let totalFood = 0, totalTravel = 0, totalEntertainment = 0;
        Object.values(monthExpenses).forEach(exp => {
            totalFood += exp.food || 0;
            totalTravel += exp.travel || 0;
            totalEntertainment += exp.entertainment || 0;
        });

        if (totalFood > this.userProfile.income * 0.25) {
            tips += '🍽️ **Food**: Try meal planning, bulk cooking, and eating out less\n';
        }
        if (totalTravel > this.userProfile.income * 0.15) {
            tips += '🚗 **Transport**: Consider carpooling, public transport, or biking\n';
        }
        if (totalEntertainment > this.userProfile.income * 0.1) {
            tips += '🎬 **Entertainment**: Look for free activities, use streaming instead of cinema\n';
        }

        tips += `
🔍 **General Tips**:
• Review subscriptions monthly
• Compare prices before big purchases
• Use cashback apps and coupons
• Buy generic brands for basics
• Negotiate bills (phone, internet, insurance)

📱 **Apps to Help**: Honey, Rakuten, Mint, YNAB`;

        return tips;
    }

    getGoalPlanningAdvice() {
        return `🎯 **Financial Goal Planning:**

📋 **Step-by-Step Process**:
1. **Define Clear Goals**: Emergency fund, vacation, house, retirement
2. **Make Them SMART**: Specific, Measurable, Achievable, Relevant, Time-bound
3. **Prioritize**: Rank by importance and urgency
4. **Calculate**: How much you need monthly to reach each goal
5. **Automate**: Set up automatic transfers

💡 **Example Goals**:
• Emergency Fund: $${(this.userProfile.income * 6).toFixed(2)} (6 months expenses)
• Vacation: $3,000 in 12 months = $250/month
• House Down Payment: $50,000 in 5 years = $833/month

🏆 **Success Tips**:
• Start small and build momentum
• Celebrate milestones
• Review and adjust monthly
• Use separate accounts for each goal
• Track progress visually`;
    }

    getGeneralAdvice() {
        const tips = [
            `💡 **Financial Tip**: The best time to start investing was 20 years ago. The second best time is now!`,
            `📈 **Smart Move**: Increase your savings rate by 1% every time you get a raise.`,
            `🎯 **Goal Setting**: Write down your financial goals. You're 42% more likely to achieve them!`,
            `💰 **Emergency Fund**: Start with just $500. It can prevent most financial emergencies.`,
            `📊 **Budget Rule**: Try the 50/30/20 rule - 50% needs, 30% wants, 20% savings/debt.`,
            `🔄 **Automation**: Automate your savings and investments. You can't spend what you don't see!`
        ];
        
        return tips[Math.floor(Math.random() * tips.length)];
    }

    generateFinancialContext() {
        const currentMonth = new Date().getMonth();
        const monthExpenses = this.expenses[currentMonth] || {};
        const totalExpenses = Object.values(monthExpenses).reduce((sum, exp) => sum + exp.total, 0);
        
        return `
        Monthly Income: $${this.userProfile.income}
        Current Month Expenses: $${totalExpenses.toFixed(2)}
        Savings Goal: ${this.userProfile.savingsGoal}%
        Portfolio Goal: $${this.userProfile.portfolioGoal}
        Total Invested: $${this.portfolio.totalInvested || 0}
        Portfolio Value: $${this.portfolio.currentValue || 0}
        Number of Investments: ${this.portfolio.investments?.length || 0}
        `;
    }

    addMessage(sender, content) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        if (sender === 'bot') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">${this.formatMessage(content)}</div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">${content}</div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessage(content) {
        // Simple markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/•/g, '&bull;');
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message bot-message typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        document.getElementById('chatbot-messages').appendChild(indicator);
        document.getElementById('chatbot-messages').scrollTop = document.getElementById('chatbot-messages').scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Update chatbot context when user data changes
    updateContext(userProfile, expenses, portfolio) {
        this.userProfile = userProfile;
        this.expenses = expenses;
        this.portfolio = portfolio;
    }
}
