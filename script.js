let currentUser = null;
let expenses = JSON.parse(localStorage.getItem('expenses')) || {};
let portfolio = JSON.parse(localStorage.getItem('portfolio')) || { 
    investments: [], 
    totalInvested: 0, 
    currentValue: 0,
    lastUpdated: new Date().toISOString()
};
let selectedExpenseId = null;
let expenseChart = null;
let monthlyTrendChart = null;

// Investment type configurations with realistic annual returns
const investmentTypes = {
    stocks: { 
        name: 'Stocks', 
        annualReturn: 0.11, 
        volatility: 0.15, 
        color: '#2ed573' 
    },
    bonds: { 
        name: 'Bonds', 
        annualReturn: 0.05, 
        volatility: 0.03, 
        color: '#3742fa' 
    },
    mutual_funds: { 
        name: 'Mutual Funds', 
        annualReturn: 0.09, 
        volatility: 0.12, 
        color: '#ffa502' 
    },
    etf: { 
        name: 'ETF', 
        annualReturn: 0.08, 
        volatility: 0.10, 
        color: '#ff4757' 
    },
    crypto: { 
        name: 'Cryptocurrency', 
        annualReturn: 0.25, 
        volatility: 0.40, 
        color: '#a55eea' 
    },
    real_estate: { 
        name: 'Real Estate', 
        annualReturn: 0.07, 
        volatility: 0.05, 
        color: '#26de81' 
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Force dashboard to be hidden on load
    const dashboardSection = document.getElementById('dashboardSection');
    const authSection = document.getElementById('authSection');
    
    dashboardSection.classList.add('hidden');
    dashboardSection.style.display = 'none';
    dashboardSection.style.visibility = 'hidden';
    dashboardSection.style.opacity = '0';
    
    authSection.classList.remove('hidden');
    authSection.style.display = 'block';
    
    // Set default investment date to today
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('investmentDate')) {
        document.getElementById('investmentDate').value = today;
    }
    
    updateCurrentDate();
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
    
    // Check for spending alerts
    setTimeout(checkSpendingAlerts, 2000);
});

function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

function login() {
    const username = document.getElementById('username').value.trim();
    const income = parseFloat(document.getElementById('income').value);
    const savingsGoal = parseFloat(document.getElementById('savingsGoal').value) || 20;
    const portfolioGoal = parseFloat(document.getElementById('portfolioGoal').value) || 0;
    
    if (!username || !income || income <= 0) {
        showNotification('Please fill in all fields with valid values', 'error');
        return;
    }
    
    currentUser = { username, income, savingsGoal, portfolioGoal };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showDashboard();
    showNotification(`Welcome back, ${username}!`, 'success');
}

function showDashboard() {
    // Force hide auth section
    const authSection = document.getElementById('authSection');
    authSection.classList.add('hidden');
    authSection.style.display = 'none';
    
    // Force show dashboard section
    const dashboardSection = document.getElementById('dashboardSection');
    dashboardSection.classList.remove('hidden');
    dashboardSection.style.display = 'block';
    dashboardSection.style.visibility = 'visible';
    dashboardSection.style.opacity = '1';
    
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userIncome').textContent = currentUser.income.toFixed(2);
    
    const currentMonth = new Date().getMonth();
    document.getElementById('monthSelect').value = currentMonth;
    updateSavingsGoal();
    updatePortfolioDisplay();
    displayExpenses();
    updateFinancialInsights();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Force show auth section
        const authSection = document.getElementById('authSection');
        authSection.classList.remove('hidden');
        authSection.style.display = 'block';
        
        // Force hide dashboard section
        const dashboardSection = document.getElementById('dashboardSection');
        dashboardSection.classList.add('hidden');
        dashboardSection.style.display = 'none';
        dashboardSection.style.visibility = 'hidden';
        dashboardSection.style.opacity = '0';
        
        document.getElementById('username').value = '';
        document.getElementById('income').value = '';
        document.getElementById('savingsGoal').value = '20';
        document.getElementById('portfolioGoal').value = '';
        showNotification('Logged out successfully', 'info');
    }
}

function addExpense() {
    const food = parseFloat(document.getElementById('expenseFood').value) || 0;
    const travel = parseFloat(document.getElementById('expenseTravel').value) || 0;
    const entertainment = parseFloat(document.getElementById('expenseEntertainment').value) || 0;
    const miscellaneous = parseFloat(document.getElementById('expenseMiscellaneous').value) || 0;
    const description = document.getElementById('expenseDescription').value.trim();
    
    if (food === 0 && travel === 0 && entertainment === 0 && miscellaneous === 0) {
        showNotification('Please enter at least one expense amount', 'warning');
        return;
    }
    
    const month = parseInt(document.getElementById('monthSelect').value);
    const date = new Date().toLocaleDateString();
    const expenseId = Date.now().toString();
    
    if (!expenses[month]) expenses[month] = {};
    
    expenses[month][expenseId] = {
        date,
        food: Math.round(food * 100) / 100,
        travel: Math.round(travel * 100) / 100,
        entertainment: Math.round(entertainment * 100) / 100,
        miscellaneous: Math.round(miscellaneous * 100) / 100,
        description,
        total: Math.round((food + travel + entertainment + miscellaneous) * 100) / 100
    };
    
    localStorage.setItem('expenses', JSON.stringify(expenses));
    clearExpenseInputs();
    displayExpenses();
    showNotification('Expense added successfully!', 'success');
}

function editExpense() {
    if (!selectedExpenseId) {
        showNotification('Please select an expense to edit', 'warning');
        return;
    }
    
    const month = parseInt(document.getElementById('monthSelect').value);
    const expense = expenses[month][selectedExpenseId];
    
    // Prevent editing investment expenses
    if (expense.isInvestment) {
        showNotification('Investment expenses cannot be edited here. Use the Portfolio section to manage investments.', 'warning');
        return;
    }
    
    document.getElementById('expenseFood').value = expense.food;
    document.getElementById('expenseTravel').value = expense.travel;
    document.getElementById('expenseEntertainment').value = expense.entertainment;
    document.getElementById('expenseMiscellaneous').value = expense.miscellaneous;
    document.getElementById('expenseDescription').value = expense.description || '';
    delete expenses[month][selectedExpenseId];
    localStorage.setItem('expenses', JSON.stringify(expenses));
    selectedExpenseId = null;
    displayExpenses();
    showNotification('Expense loaded for editing', 'info');
}

function deleteExpense() {
    if (!selectedExpenseId) {
        showNotification('Please select an expense to delete', 'warning');
        return;
    }
    
    const month = parseInt(document.getElementById('monthSelect').value);
    const expense = expenses[month][selectedExpenseId];
    
    // Prevent deleting investment expenses
    if (expense.isInvestment) {
        showNotification('Investment expenses cannot be deleted here. Use the Portfolio section to manage investments.', 'warning');
        return;
    }
    
    if (confirm('Are you sure you want to delete this expense?')) {
        delete expenses[month][selectedExpenseId];
        localStorage.setItem('expenses', JSON.stringify(expenses));
        selectedExpenseId = null;
        displayExpenses();
        showNotification('Expense deleted successfully', 'success');
    }
}

function displayExpenses() {
    const month = parseInt(document.getElementById('monthSelect').value);
    const monthExpenses = expenses[month] || {};
    const tbody = document.getElementById('expenseTableBody');
    tbody.innerHTML = '';
    
    let totalFood = 0, totalTravel = 0, totalEntertainment = 0, totalMiscellaneous = 0, grandTotal = 0;
    
    // Sort expenses by date (newest first)
    const sortedEntries = Object.entries(monthExpenses).sort((a, b) => 
        new Date(b[1].date) - new Date(a[1].date)
    );
    
    sortedEntries.forEach(([id, expense]) => {
        const row = tbody.insertRow();
        row.onclick = () => selectExpense(id, row);
        
        // Style investment rows differently
        if (expense.isInvestment) {
            row.classList.add('investment-row');
        }
        
        row.innerHTML = `
            <td>${expense.date}</td>
            <td>$${expense.food.toFixed(2)}</td>
            <td>$${expense.travel.toFixed(2)}</td>
            <td>$${expense.entertainment.toFixed(2)}</td>
            <td>$${expense.miscellaneous.toFixed(2)}</td>
            <td class="description-cell">${expense.description || '-'}</td>
            <td class="total-cell">$${expense.total.toFixed(2)}</td>
        `;
        totalFood += expense.food;
        totalTravel += expense.travel;
        totalEntertainment += expense.entertainment;
        totalMiscellaneous += expense.miscellaneous;
        grandTotal += expense.total;
    });
    
    // Add totals row
    const totalRow = tbody.insertRow();
    totalRow.className = 'total-row';
    totalRow.innerHTML = `
        <td><strong>Total</strong></td>
        <td><strong>$${totalFood.toFixed(2)}</strong></td>
        <td><strong>$${totalTravel.toFixed(2)}</strong></td>
        <td><strong>$${totalEntertainment.toFixed(2)}</strong></td>
        <td><strong>$${totalMiscellaneous.toFixed(2)}</strong></td>
        <td><strong>-</strong></td>
        <td><strong>$${grandTotal.toFixed(2)}</strong></td>
    `;
    
    updateStats(grandTotal);
    updateCharts();
    checkSpendingAlerts();
    updateFinancialInsights();
}

function updateStats(totalExpenses) {
    document.getElementById('totalExpenses').textContent = totalExpenses.toFixed(2);
    const remaining = currentUser.income - totalExpenses;
    document.getElementById('remainingBudget').textContent = remaining.toFixed(2);
    
    // Update progress bars
    const budgetUsedPercent = (totalExpenses / currentUser.income) * 100;
    const budgetProgress = document.getElementById('budgetProgress');
    budgetProgress.style.width = Math.min(budgetUsedPercent, 100) + '%';
    document.getElementById('budgetPercentage').textContent = budgetUsedPercent.toFixed(1) + '%';
    
    // Color coding for budget progress
    if (budgetUsedPercent > 90) {
        budgetProgress.style.backgroundColor = '#ff4757';
    } else if (budgetUsedPercent > 70) {
        budgetProgress.style.backgroundColor = '#ffa502';
    } else {
        budgetProgress.style.backgroundColor = '#2ed573';
    }
    
    updateSavingsProgress(remaining);
    updatePortfolioProgress();
}

function updateSavingsProgress(remaining) {
    const savingsGoalAmount = (currentUser.income * currentUser.savingsGoal) / 100;
    document.getElementById('savingsGoalAmount').textContent = savingsGoalAmount.toFixed(2);
    
    const savingsPercent = remaining > 0 ? (remaining / savingsGoalAmount) * 100 : 0;
    const savingsProgress = document.getElementById('savingsProgress');
    savingsProgress.style.width = Math.min(savingsPercent, 100) + '%';
    document.getElementById('savingsPercentage').textContent = savingsPercent.toFixed(1) + '%';
    
    // Color coding for savings progress
    if (savingsPercent >= 100) {
        savingsProgress.style.backgroundColor = '#2ed573';
    } else if (savingsPercent >= 50) {
        savingsProgress.style.backgroundColor = '#ffa502';
    } else {
        savingsProgress.style.backgroundColor = '#ff4757';
    }
}

function updateSavingsGoal() {
    const savingsGoalAmount = (currentUser.income * currentUser.savingsGoal) / 100;
    document.getElementById('savingsGoalAmount').textContent = savingsGoalAmount.toFixed(2);
}

function selectExpense(id, row) {
    document.querySelectorAll('#expenseTableBody tr').forEach(r => r.classList.remove('selected-row'));
    row.classList.add('selected-row');
    selectedExpenseId = id;
}

function clearExpenseInputs() {
    document.getElementById('expenseFood').value = '';
    document.getElementById('expenseTravel').value = '';
    document.getElementById('expenseEntertainment').value = '';
    document.getElementById('expenseMiscellaneous').value = '';
    document.getElementById('expenseDescription').value = '';
}

// View toggle functions
function showTable() {
    document.getElementById('tableView').classList.remove('hidden');
    document.getElementById('chartView').classList.add('hidden');
    document.getElementById('tableToggle').classList.add('active');
    document.getElementById('chartToggle').classList.remove('active');
}

function showChart() {
    document.getElementById('tableView').classList.add('hidden');
    document.getElementById('chartView').classList.remove('hidden');
    document.getElementById('tableToggle').classList.remove('active');
    document.getElementById('chartToggle').classList.add('active');
    updateCharts();
}

// Chart functions
function updateCharts() {
    updateExpenseChart();
    updateMonthlyTrendChart();
}

function updateExpenseChart() {
    const month = parseInt(document.getElementById('monthSelect').value);
    const monthExpenses = expenses[month] || {};
    
    let totalFood = 0, totalTravel = 0, totalEntertainment = 0, totalMiscellaneous = 0;
    
    Object.values(monthExpenses).forEach(expense => {
        totalFood += expense.food;
        totalTravel += expense.travel;
        totalEntertainment += expense.entertainment;
        totalMiscellaneous += expense.miscellaneous;
    });
    
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Food', 'Travel', 'Entertainment', 'Miscellaneous'],
            datasets: [{
                data: [totalFood, totalTravel, totalEntertainment, totalMiscellaneous],
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Expense Breakdown'
                }
            }
        }
    });
}

function updateMonthlyTrendChart() {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTotals = [];
    
    for (let i = 0; i < 12; i++) {
        const monthExpenses = expenses[i] || {};
        const total = Object.values(monthExpenses).reduce((sum, expense) => sum + expense.total, 0);
        monthlyTotals.push(total);
    }
    
    const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
    
    if (monthlyTrendChart) {
        monthlyTrendChart.destroy();
    }
    
    monthlyTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthNames,
            datasets: [{
                label: 'Monthly Expenses',
                data: monthlyTotals,
                borderColor: '#764ba2',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Expense Trend'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

// Portfolio Management Functions
function updatePortfolioDisplay() {
    calculatePortfolioGrowth();
    
    const totalInvested = portfolio.totalInvested || 0;
    const currentValue = portfolio.currentValue || 0;
    const totalGains = currentValue - totalInvested;
    const gainsPercentage = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;
    
    document.getElementById('portfolioValue').textContent = currentValue.toFixed(2);
    document.getElementById('monthlyInvestment').textContent = (currentUser.portfolioGoal || 0).toFixed(2);
    document.getElementById('totalInvested').textContent = totalInvested.toFixed(2);
    document.getElementById('currentPortfolioValue').textContent = currentValue.toFixed(2);
    document.getElementById('totalGains').textContent = totalGains.toFixed(2);
    document.getElementById('gainsPercentage').textContent = (gainsPercentage >= 0 ? '+' : '') + gainsPercentage.toFixed(2);
    document.getElementById('activeInvestments').textContent = portfolio.investments.length;
    
    // Color code gains/losses
    const gainsElement = document.querySelector('.portfolio-gains');
    if (totalGains > 0) {
        gainsElement.style.color = '#2ed573';
    } else if (totalGains < 0) {
        gainsElement.style.color = '#ff4757';
    } else {
        gainsElement.style.color = '#666';
    }
    
    updateInvestmentHistory();
}

function updatePortfolioProgress() {
    if (!currentUser.portfolioGoal) return;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Calculate this month's investments
    const monthlyInvestments = portfolio.investments.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    });
    
    const monthlyTotal = monthlyInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const progressPercent = (monthlyTotal / currentUser.portfolioGoal) * 100;
    
    const portfolioProgress = document.getElementById('portfolioProgress');
    portfolioProgress.style.width = Math.min(progressPercent, 100) + '%';
    document.getElementById('portfolioPercentage').textContent = progressPercent.toFixed(1) + '%';
    
    // Color coding
    if (progressPercent >= 100) {
        portfolioProgress.style.backgroundColor = '#2ed573';
    } else if (progressPercent >= 50) {
        portfolioProgress.style.backgroundColor = '#ffa502';
    } else {
        portfolioProgress.style.backgroundColor = '#ff4757';
    }
}

function calculatePortfolioGrowth() {
    const today = new Date();
    let totalCurrentValue = 0;
    
    portfolio.investments.forEach(investment => {
        const investmentDate = new Date(investment.date);
        const yearsElapsed = (today - investmentDate) / (365.25 * 24 * 60 * 60 * 1000);
        
        if (yearsElapsed >= 0) {
            const investmentConfig = investmentTypes[investment.type];
            
            // Add some realistic market volatility simulation
            const randomFactor = 1 + (Math.random() - 0.5) * investmentConfig.volatility * 0.5;
            const annualReturn = investmentConfig.annualReturn * randomFactor;
            
            // Calculate compound growth
            const currentValue = investment.amount * Math.pow(1 + annualReturn, yearsElapsed);
            investment.currentValue = currentValue;
            totalCurrentValue += currentValue;
        } else {
            investment.currentValue = investment.amount;
            totalCurrentValue += investment.amount;
        }
    });
    
    portfolio.currentValue = totalCurrentValue;
    portfolio.lastUpdated = today.toISOString();
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
}

function addInvestment() {
    const type = document.getElementById('investmentType').value;
    const amount = parseFloat(document.getElementById('investmentAmount').value);
    const date = document.getElementById('investmentDate').value;
    
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid investment amount', 'warning');
        return;
    }
    
    if (!date) {
        showNotification('Please select an investment date', 'warning');
        return;
    }
    
    // Check if user has enough remaining budget for this investment
    const investmentDate = new Date(date);
    const investmentMonth = investmentDate.getMonth();
    const investmentYear = investmentDate.getFullYear();
    
    // Check budget availability for the investment month (only for current year)
    if (investmentYear === new Date().getFullYear()) {
        const monthExpenses = expenses[investmentMonth] || {};
        const totalExpenses = Object.values(monthExpenses).reduce((sum, expense) => sum + expense.total, 0);
        const remainingBudget = currentUser.income - totalExpenses;
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        if (amount > remainingBudget) {
            if (!confirm(`This investment of $${amount.toFixed(2)} exceeds your remaining budget of $${remainingBudget.toFixed(2)} for ${monthNames[investmentMonth]}. Continue anyway?`)) {
                return;
            }
        }
    }
    
    const investment = {
        id: Date.now().toString(),
        type,
        typeName: investmentTypes[type].name,
        amount,
        date,
        currentValue: amount,
        addedDate: new Date().toISOString()
    };
    
    portfolio.investments.push(investment);
    portfolio.totalInvested += amount;
    
    // Add investment as an expense entry for budget tracking
    addInvestmentAsExpense(investment, investmentMonth, investmentYear);
    
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    
    // Clear form
    document.getElementById('investmentAmount').value = '';
    document.getElementById('investmentDate').value = new Date().toISOString().split('T')[0];
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    updatePortfolioDisplay();
    updatePortfolioProgress();
    
    // Refresh expenses view if we're currently viewing the investment month
    const currentViewMonth = parseInt(document.getElementById('monthSelect').value);
    if (currentViewMonth === investmentMonth) {
        displayExpenses(); // Refresh expenses to show investment
    }
    
    showNotification(`Investment of $${amount.toFixed(2)} in ${investmentTypes[type].name} added successfully for ${monthNames[investmentMonth]}!`, 'success');
}

function addInvestmentAsExpense(investment, month, year) {
    // Only add as expense if it's in the current year (for budget tracking)
    if (year !== new Date().getFullYear()) return;
    
    if (!expenses[month]) expenses[month] = {};
    
    const expenseId = `investment_${investment.id}`;
    const investmentExpense = {
        date: new Date(investment.date).toLocaleDateString(),
        food: 0,
        travel: 0,
        entertainment: 0,
        miscellaneous: investment.amount, // Add investment to miscellaneous category
        description: `📈 Investment: ${investment.typeName}`,
        total: investment.amount,
        isInvestment: true, // Flag to identify investment expenses
        investmentId: investment.id
    };
    
    expenses[month][expenseId] = investmentExpense;
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function updateInvestmentHistory() {
    const historyList = document.getElementById('investmentHistoryList');
    
    if (portfolio.investments.length === 0) {
        historyList.innerHTML = '<div class="no-investments">No investments yet. Start building your portfolio!</div>';
        return;
    }
    
    // Sort by date (newest first)
    const sortedInvestments = [...portfolio.investments].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    historyList.innerHTML = sortedInvestments.map(investment => {
        const gains = investment.currentValue - investment.amount;
        const gainsPercent = ((gains / investment.amount) * 100).toFixed(2);
        const investmentConfig = investmentTypes[investment.type];
        
        return `
            <div class="investment-item">
                <div class="investment-header">
                    <span class="investment-type" style="color: ${investmentConfig.color}">
                        <i class="fas fa-circle"></i> ${investment.typeName}
                    </span>
                    <span class="investment-date">${new Date(investment.date).toLocaleDateString()}</span>
                    <button class="remove-btn" onclick="removeInvestment('${investment.id}')" title="Remove Investment">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="investment-details">
                    <div class="investment-amount">Invested: $${investment.amount.toFixed(2)}</div>
                    <div class="investment-value">Current: $${investment.currentValue.toFixed(2)}</div>
                    <div class="investment-gains ${gains >= 0 ? 'positive' : 'negative'}">
                        ${gains >= 0 ? '+' : ''}$${gains.toFixed(2)} (${gainsPercent >= 0 ? '+' : ''}${gainsPercent}%)
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function removeInvestment(investmentId) {
    const investment = portfolio.investments.find(inv => inv.id === investmentId);
    if (!investment) return;
    
    if (confirm(`Are you sure you want to remove this ${investment.typeName} investment of $${investment.amount.toFixed(2)}?`)) {
        // Remove from portfolio
        portfolio.investments = portfolio.investments.filter(inv => inv.id !== investmentId);
        portfolio.totalInvested -= investment.amount;
        
        if (portfolio.totalInvested < 0) portfolio.totalInvested = 0;
        
        // Also remove the corresponding expense entry
        removeInvestmentExpense(investmentId);
        
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        updatePortfolioDisplay();
        updatePortfolioProgress();
        displayExpenses(); // Refresh expenses to remove investment expense
        showNotification('Investment removed successfully', 'info');
    }
}

function removeInvestmentExpense(investmentId) {
    // Find and remove the expense entry for this investment
    for (let month = 0; month < 12; month++) {
        if (expenses[month]) {
            const expenseId = `investment_${investmentId}`;
            if (expenses[month][expenseId]) {
                delete expenses[month][expenseId];
            }
        }
    }
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function togglePortfolioSection() {
    const details = document.getElementById('portfolioDetails');
    const toggle = document.getElementById('portfolioToggle');
    
    if (details.classList.contains('hidden')) {
        details.classList.remove('hidden');
        toggle.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Details';
        // Update investment date to today when showing
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('investmentDate').value = today;
    } else {
        details.classList.add('hidden');
        toggle.innerHTML = '<i class="fas fa-chevron-down"></i> Show Details';
    }
}

// Financial Insights Functions
function checkSpendingAlerts() {
    const month = parseInt(document.getElementById('monthSelect').value);
    const monthExpenses = expenses[month] || {};
    const totalExpenses = Object.values(monthExpenses).reduce((sum, expense) => sum + expense.total, 0);
    
    const budgetLimit = currentUser.income;
    const savingsTarget = (currentUser.income * currentUser.savingsGoal) / 100;
    const remainingBudget = budgetLimit - totalExpenses;
    
    const alertsContainer = document.getElementById('alertsContainer');
    alertsContainer.innerHTML = '';
    
    // Check if near budget limit (90% spent)
    if (totalExpenses >= budgetLimit * 0.9 && totalExpenses < budgetLimit) {
        showAlert('warning', 'You\'re approaching your monthly budget limit!', alertsContainer);
    }
    
    // Check if budget exceeded
    if (totalExpenses >= budgetLimit) {
        showAlert('danger', 'You have exceeded your monthly budget!', alertsContainer);
    }
    
    // Check if savings goal is at risk
    if (remainingBudget < savingsTarget) {
        showAlert('info', 'Your savings goal for this month is at risk!', alertsContainer);
    }
    
    // Check portfolio investment goal
    if (currentUser.portfolioGoal) {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const monthlyInvestments = portfolio.investments.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        });
        
        const monthlyTotal = monthlyInvestments.reduce((sum, inv) => sum + inv.amount, 0);
        const remaining = currentUser.portfolioGoal - monthlyTotal;
        
        if (remaining > 0) {
            showAlert('portfolio', `You need $${remaining.toFixed(2)} more to reach your monthly investment goal of $${currentUser.portfolioGoal.toFixed(2)}`, alertsContainer);
        }
    }
}

function showAlert(type, message, container) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const icons = {
        danger: 'exclamation-triangle',
        warning: 'exclamation-circle',
        info: 'info-circle',
        portfolio: 'chart-line'
    };
    
    alert.innerHTML = `
        <i class="fas fa-${icons[type]}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="alert-close">×</button>
    `;
    
    container.appendChild(alert);
}

function updateFinancialInsights() {
    updateSpendingAlerts();
    updateCategoryAnalysis();
    updateRecommendations();
    updateMonthlyComparison();
}

function updateSpendingAlerts() {
    const alertsList = document.getElementById('spendingAlerts');
    const month = parseInt(document.getElementById('monthSelect').value);
    const monthExpenses = expenses[month] || {};
    const totalExpenses = Object.values(monthExpenses).reduce((sum, expense) => sum + expense.total, 0);
    
    let alerts = [];
    
    // Budget usage alerts
    const budgetUsage = (totalExpenses / currentUser.income) * 100;
    if (budgetUsage > 100) {
        alerts.push({ type: 'danger', message: `Budget exceeded by ${(budgetUsage - 100).toFixed(1)}%` });
    } else if (budgetUsage > 80) {
        alerts.push({ type: 'warning', message: `${budgetUsage.toFixed(1)}% of budget used` });
    }
    
    alertsList.innerHTML = alerts.length ? 
        alerts.map(alert => `<div class="alert-item ${alert.type}">${alert.message}</div>`).join('') :
        '<div class="no-alerts">All good! No spending alerts.</div>';
}

function updateCategoryAnalysis() {
    const analysisContent = document.getElementById('categoryAnalysis');
    const month = parseInt(document.getElementById('monthSelect').value);
    const monthExpenses = expenses[month] || {};
    
    const totals = { food: 0, travel: 0, entertainment: 0, miscellaneous: 0, investments: 0 };
    Object.values(monthExpenses).forEach(expense => {
        if (expense.isInvestment) {
            totals.investments += expense.total;
        } else {
            totals.food += expense.food;
            totals.travel += expense.travel;
            totals.entertainment += expense.entertainment;
            totals.miscellaneous += expense.miscellaneous;
        }
    });
    
    const total = Object.values(totals).reduce((sum, val) => sum + val, 0);
    
    if (total === 0) {
        analysisContent.innerHTML = '<div class="no-data">No expenses for analysis</div>';
        return;
    }
    
    const categories = Object.entries(totals)
        .filter(([_, amount]) => amount > 0) // Only show categories with expenses
        .map(([category, amount]) => ({
            category: category === 'miscellaneous' ? 'Miscellaneous' : 
                     category === 'investments' ? 'Investments' :
                     category.charAt(0).toUpperCase() + category.slice(1),
            amount,
            percentage: ((amount / total) * 100).toFixed(1),
            isInvestment: category === 'investments'
        }))
        .sort((a, b) => b.amount - a.amount);
    
    analysisContent.innerHTML = categories.map(cat => `
        <div class="category-item ${cat.isInvestment ? 'investment-category' : ''}">
            <span class="category-name">${cat.category}${cat.isInvestment ? ' 📈' : ''}</span>
            <span class="category-amount">$${cat.amount.toFixed(2)} (${cat.percentage}%)</span>
        </div>
    `).join('');
}

function updateRecommendations() {
    const recommendationsList = document.getElementById('recommendations');
    const month = parseInt(document.getElementById('monthSelect').value);
    const monthExpenses = expenses[month] || {};
    
    const totals = { food: 0, travel: 0, entertainment: 0, miscellaneous: 0 };
    Object.values(monthExpenses).forEach(expense => {
        totals.food += expense.food;
        totals.travel += expense.travel;
        totals.entertainment += expense.entertainment;
        totals.miscellaneous += expense.miscellaneous;
    });
    
    const total = Object.values(totals).reduce((sum, val) => sum + val, 0);
    const recommendations = [];
    
    // Generate recommendations based on spending patterns
    if (totals.food > currentUser.income * 0.3) {
        recommendations.push('Consider meal planning and cooking at home to reduce food expenses');
    }
    
    if (totals.entertainment > currentUser.income * 0.15) {
        recommendations.push('Look for free or low-cost entertainment alternatives');
    }
    
    if (totals.travel > currentUser.income * 0.2) {
        recommendations.push('Consider carpooling or public transport to reduce travel costs');
    }
    
    if (total > currentUser.income * 0.8) {
        recommendations.push('Focus on essential expenses only for the rest of the month');
    }
    
    // Portfolio recommendations
    if (currentUser.portfolioGoal) {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const monthlyInvestments = portfolio.investments.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        });
        
        const monthlyTotal = monthlyInvestments.reduce((sum, inv) => sum + inv.amount, 0);
        const remaining = currentUser.portfolioGoal - monthlyTotal;
        
        if (remaining > 0) {
            recommendations.push(`Invest $${remaining.toFixed(2)} more this month to reach your investment goal`);
        }
        
        // Diversification recommendation
        const investmentTypes = [...new Set(portfolio.investments.map(inv => inv.type))];
        if (portfolio.investments.length > 0 && investmentTypes.length === 1) {
            recommendations.push('Consider diversifying your portfolio with different investment types');
        }
        
        // Long-term investment advice
        if (portfolio.totalInvested > 0 && portfolio.totalInvested < currentUser.income * 3) {
            recommendations.push('Aim to invest at least 3-6 months of income for financial security');
        }
    } else if (remainingBudget > currentUser.income * 0.1) {
        recommendations.push('Consider setting up a monthly investment goal to grow your wealth');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('Great job! Your spending is well-balanced.');
    }
    
    recommendationsList.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item">
            <i class="fas fa-lightbulb"></i>
            <span>${rec}</span>
        </div>
    `).join('');
}

function updateMonthlyComparison() {
    const comparisonContent = document.getElementById('monthlyComparison');
    const currentMonth = parseInt(document.getElementById('monthSelect').value);
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    const currentExpenses = expenses[currentMonth] || {};
    const previousExpenses = expenses[previousMonth] || {};
    
    const currentTotal = Object.values(currentExpenses).reduce((sum, expense) => sum + expense.total, 0);
    const previousTotal = Object.values(previousExpenses).reduce((sum, expense) => sum + expense.total, 0);
    
    if (previousTotal === 0) {
        comparisonContent.innerHTML = '<div class="no-data">No previous month data for comparison</div>';
        return;
    }
    
    const difference = currentTotal - previousTotal;
    const percentChange = ((difference / previousTotal) * 100).toFixed(1);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    comparisonContent.innerHTML = `
        <div class="comparison-item">
            <span>This month (${monthNames[currentMonth]}): $${currentTotal.toFixed(2)}</span>
        </div>
        <div class="comparison-item">
            <span>Last month (${monthNames[previousMonth]}): $${previousTotal.toFixed(2)}</span>
        </div>
        <div class="comparison-item ${difference > 0 ? 'negative' : 'positive'}">
            <span>Change: ${difference > 0 ? '+' : ''}$${difference.toFixed(2)} (${difference > 0 ? '+' : ''}${percentChange}%)</span>
        </div>
    `;
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function exportData() {
    const month = parseInt(document.getElementById('monthSelect').value);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthExpenses = expenses[month] || {};
    
    if (Object.keys(monthExpenses).length === 0) {
        showNotification('No data to export for this month', 'warning');
        return;
    }
    
    let csv = 'Date,Food,Travel,Entertainment,Miscellaneous,Description,Total\n';
    
    Object.values(monthExpenses).forEach(expense => {
        csv += `${expense.date},${expense.food},${expense.travel},${expense.entertainment},${expense.miscellaneous},"${expense.description || ''}",${expense.total}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses_${monthNames[month]}_${new Date().getFullYear()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}

function clearAllExpenses() {
    const month = parseInt(document.getElementById('monthSelect').value);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    if (confirm(`Are you sure you want to clear all expenses for ${monthNames[month]}? This action cannot be undone.`)) {
        expenses[month] = {};
        localStorage.setItem('expenses', JSON.stringify(expenses));
        displayExpenses();
        showNotification(`All expenses for ${monthNames[month]} have been cleared`, 'info');
    }
}

// Clear localStorage function for debugging
function clearAllData() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('expenses');
    localStorage.removeItem('portfolio');
    location.reload();
}

// Add to window for debugging
window.clearAllData = clearAllData;