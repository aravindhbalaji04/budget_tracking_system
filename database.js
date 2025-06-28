import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'YOUR_SUPABASE_URL' // Replace with your Supabase URL
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY' // Replace with your Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database service class
export class DatabaseService {
    constructor() {
        this.supabase = supabase
    }

    // User authentication
    async signUp(email, password, userData) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        })
        return { data, error }
    }

    async signIn(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        })
        return { data, error }
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut()
        return { error }
    }

    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser()
        return user
    }

    // User profile management
    async saveUserProfile(userId, profile) {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .upsert({
                id: userId,
                username: profile.username,
                income: profile.income,
                savings_goal: profile.savingsGoal,
                portfolio_goal: profile.portfolioGoal,
                updated_at: new Date().toISOString()
            })
        return { data, error }
    }

    async getUserProfile(userId) {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()
        return { data, error }
    }

    // Expenses management
    async saveExpense(userId, expense) {
        const { data, error } = await this.supabase
            .from('expenses')
            .insert({
                user_id: userId,
                month: expense.month,
                year: expense.year,
                date: expense.date,
                food: expense.food,
                travel: expense.travel,
                entertainment: expense.entertainment,
                miscellaneous: expense.miscellaneous,
                description: expense.description,
                total: expense.total,
                is_investment: expense.isInvestment || false,
                investment_id: expense.investmentId || null
            })
        return { data, error }
    }

    async getExpenses(userId, year = new Date().getFullYear()) {
        const { data, error } = await this.supabase
            .from('expenses')
            .select('*')
            .eq('user_id', userId)
            .eq('year', year)
            .order('date', { ascending: false })
        return { data, error }
    }

    async updateExpense(expenseId, updates) {
        const { data, error } = await this.supabase
            .from('expenses')
            .update(updates)
            .eq('id', expenseId)
        return { data, error }
    }

    async deleteExpense(expenseId) {
        const { data, error } = await this.supabase
            .from('expenses')
            .delete()
            .eq('id', expenseId)
        return { data, error }
    }

    // Portfolio management
    async saveInvestment(userId, investment) {
        const { data, error } = await this.supabase
            .from('investments')
            .insert({
                user_id: userId,
                type: investment.type,
                type_name: investment.typeName,
                amount: investment.amount,
                date: investment.date,
                current_value: investment.currentValue,
                added_date: investment.addedDate
            })
        return { data, error }
    }

    async getInvestments(userId) {
        const { data, error } = await this.supabase
            .from('investments')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
        return { data, error }
    }

    async updateInvestment(investmentId, updates) {
        const { data, error } = await this.supabase
            .from('investments')
            .update(updates)
            .eq('id', investmentId)
        return { data, error }
    }

    async deleteInvestment(investmentId) {
        const { data, error } = await this.supabase
            .from('investments')
            .delete()
            .eq('id', investmentId)
        return { data, error }
    }

    // Portfolio summary
    async getPortfolioSummary(userId) {
        const { data, error } = await this.supabase
            .from('portfolio_summary')
            .select('*')
            .eq('user_id', userId)
            .single()
        return { data, error }
    }

    async updatePortfolioSummary(userId, summary) {
        const { data, error } = await this.supabase
            .from('portfolio_summary')
            .upsert({
                user_id: userId,
                total_invested: summary.totalInvested,
                current_value: summary.currentValue,
                last_updated: summary.lastUpdated
            })
        return { data, error }
    }
}

// Create global instance
export const db = new DatabaseService()
