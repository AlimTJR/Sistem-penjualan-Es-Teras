import {
  User, Menu, Ingredient, Recipe, Closing, Kasbon, Absensi, Payroll, AppState, OperationalExpenseMaster
} from '../types';
import {
  initialUsers, initialIngredients, initialMenus, initialRecipes, initialExpenseMaster,
  generateSeedClosings, initialAbsensi, initialKasbon, initialPayroll
} from './initialData';

const STORAGE_KEY = 'kedai_teras_db_v1.1';

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.users && parsed.menus && parsed.closings) {
        if (!parsed.expenseMaster || parsed.expenseMaster.length === 0) {
          parsed.expenseMaster = initialExpenseMaster;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse state from localStorage', err);
  }

  // Fallback to initial seeds with no active user session (opens Login Page first)
  const defaultState: AppState = {
    users: initialUsers,
    absensi: initialAbsensi,
    menus: initialMenus,
    ingredients: initialIngredients,
    recipes: initialRecipes,
    expenseMaster: initialExpenseMaster,
    closings: generateSeedClosings(),
    kasbon: initialKasbon,
    payroll: initialPayroll,
    currentUserId: null, // First page opened is login for each role
  };
  saveAppState(defaultState);
  return defaultState;
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage', err);
  }
}

export function resetToDefaultState(): AppState {
  const defaultState: AppState = {
    users: initialUsers,
    absensi: initialAbsensi,
    menus: initialMenus,
    ingredients: initialIngredients,
    recipes: initialRecipes,
    expenseMaster: initialExpenseMaster,
    closings: generateSeedClosings(),
    kasbon: initialKasbon,
    payroll: initialPayroll,
    currentUserId: null, // Return to login page on reset
  };
  saveAppState(defaultState);
  return defaultState;
}

/**
 * Calculates current HPP for a menu item based on its recipe and ingredient prices
 */
export function calculateMenuHpp(menuId: string, recipes: Recipe[], ingredients: Ingredient[]): number {
  const menuRecipes = recipes.filter(r => r.menuId === menuId);
  if (menuRecipes.length === 0) return 0;

  let totalCost = 0;
  for (const r of menuRecipes) {
    const ing = ingredients.find(i => i.id === r.ingredientId);
    if (ing) {
      totalCost += r.qtyPerCup * ing.hargaPerSatuan;
    }
  }
  return Math.round(totalCost);
}

/**
 * Backward Inventory Deduction: Deducts stock based on sold cup quantities and recipe definitions
 */
export function deductIngredientsForClosing(
  closing: Closing,
  recipes: Recipe[],
  ingredients: Ingredient[]
): Ingredient[] {
  const stockDeductions: Record<string, number> = {};

  for (const item of closing.menuDetails) {
    if (item.qty <= 0) continue;
    const itemRecipes = recipes.filter(r => r.menuId === item.menuId);
    for (const r of itemRecipes) {
      const deduction = r.qtyPerCup * item.qty;
      stockDeductions[r.ingredientId] = (stockDeductions[r.ingredientId] || 0) + deduction;
    }
  }

  return ingredients.map(ing => {
    const deduction = stockDeductions[ing.id] || 0;
    return {
      ...ing,
      stokSaatIni: Math.max(0, ing.stokSaatIni - deduction),
    };
  });
}

/**
 * Converts a table to CSV format for Google Sheets / Excel export
 */
export function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') {
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}
