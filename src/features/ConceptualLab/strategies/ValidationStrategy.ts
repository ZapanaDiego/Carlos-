/**
 * Interfaz genérica para estrategias de validación de desafíos conceptuales.
 * Permite inyectar distintas reglas de validación sin alterar el componente de UI.
 */
export interface ValidationStrategy<TAnswer, TTarget> {
  /**
   * Compara la respuesta del usuario con el objetivo esperado.
   * Retorna true si es correcto, false en caso contrario.
   */
  validate(userAnswer: TAnswer, target: TTarget): boolean;
}

/**
 * Respuesta típica para la colocación de un elemento en un Array.
 */
export interface ArrayPlacementAnswer {
  placedValue: number | string | null;
  placedIndex: number | null;
}

/**
 * Objetivo esperado para el desafío de Array.
 */
export interface ArrayPlacementTarget {
  targetValue: number | string;
  targetIndex: number;
}

/**
 * Estrategia Concreta: Valida que un valor específico se haya colocado en el índice correcto de un array.
 */
export class ArrayPlacementStrategy implements ValidationStrategy<ArrayPlacementAnswer, ArrayPlacementTarget> {
  validate(userAnswer: ArrayPlacementAnswer, target: ArrayPlacementTarget): boolean {
    if (userAnswer.placedIndex === null || userAnswer.placedValue === null) {
      return false; // Incompleto
    }
    
    return (
      userAnswer.placedIndex === target.targetIndex &&
      userAnswer.placedValue === target.targetValue
    );
  }
}

// Instancia singleton compartida
export const arrayPlacementStrategy = new ArrayPlacementStrategy();
