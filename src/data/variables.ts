/**
 * Variables Configuration
 * =======================
 * 
 * CENTRAL PLACE TO DEFINE ALL SHARED VARIABLES
 * 
 * This file defines all variables that can be shared across sections.
 * AI agents should read this file to understand what variables are available.
 * 
 * USAGE:
 * 1. Define variables here with their default values and metadata
 * 2. Use them in any section with: const x = useVar('variableName', defaultValue)
 * 3. Update them with: setVar('variableName', newValue)
 */

import { type VarValue } from '@/stores';

/**
 * Variable definition with metadata
 */
export interface VariableDefinition {
    /** Default value */
    defaultValue: VarValue;
    /** Human-readable label */
    label?: string;
    /** Description for AI agents */
    description?: string;
    /** Variable type hint */
    type?: 'number' | 'text' | 'boolean' | 'select' | 'array' | 'object' | 'spotColor' | 'linkedHighlight';
    /** Unit (e.g., 'Hz', '°', 'm/s') - for numbers */
    unit?: string;
    /** Minimum value (for number sliders) */
    min?: number;
    /** Maximum value (for number sliders) */
    max?: number;
    /** Step increment (for number sliders) */
    step?: number;
    /** Display color for InlineScrubbleNumber / InlineSpotColor (e.g. '#D81B60') */
    color?: string;
    /** Options for 'select' type variables */
    options?: string[];
    /** Placeholder text for text inputs */
    placeholder?: string;
    /**
     * Correct answer for cloze input validation.
     * Accepts a single string, pipe-separated alternates (e.g. "first | 1 | 1st"),
     * or an array of accepted answers (e.g. ["first", "1", "1st"]).
     */
    correctAnswer?: string | string[];
    /** Whether cloze matching is case sensitive */
    caseSensitive?: boolean;
    /** Background color for inline components */
    bgColor?: string;
    /** Schema hint for object types (for AI agents) */
    schema?: string;
}

/**
 * =====================================================
 * 🎯 DEFINE YOUR VARIABLES HERE
 * =====================================================
 * 
 * SUPPORTED TYPES:
 * 
 * 1. NUMBER (slider):
 *    { defaultValue: 5, type: 'number', min: 0, max: 10, step: 1 }
 * 
 * 2. TEXT (free text):
 *    { defaultValue: 'Hello', type: 'text', placeholder: 'Enter text...' }
 * 
 * 3. SELECT (dropdown):
 *    { defaultValue: 'sine', type: 'select', options: ['sine', 'cosine', 'tangent'] }
 * 
 * 4. BOOLEAN (toggle):
 *    { defaultValue: true, type: 'boolean' }
 * 
 * 5. ARRAY (list of numbers):
 *    { defaultValue: [1, 2, 3], type: 'array' }
 * 
 * 6. OBJECT (complex data):
 *    { defaultValue: { x: 5, y: 10 }, type: 'object', schema: '{ x: number, y: number }' }
 */
export const variableDefinitions: Record<string, VariableDefinition> = {
    // ─────────────────────────────────────────────────────────────
    // Section 2 — Where the Line Hits Zero
    // ─────────────────────────────────────────────────────────────
    lineStartHeight: {
        defaultValue: 6,
        type: 'number',
        label: 'Starting height',
        description: 'Height of the drone above the platform at time zero (the intercept c)',
        unit: 'm',
        min: -8,
        max: 6,
        step: 0.5,
        color: '#62D0AD',
    },
    lineClimbRate: {
        defaultValue: -2,
        type: 'number',
        label: 'Climb rate',
        description: 'Metres gained per second (the gradient m); negative means descending',
        unit: 'm/s',
        min: -3,
        max: 3,
        step: 0.5,
        color: '#62D0AD',
    },
    lineHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Line figure highlight',
        description: 'Shared highlight key linking prose to the straight-line figure',
        color: '#8E90F5',
        bgColor: 'rgba(142, 144, 245, 0.22)',
    },
    answerLineRoot: {
        defaultValue: '',
        type: 'text',
        label: 'Line root answer',
        description: 'Student answer for the solution of -x + 4 = 0',
        placeholder: '???',
        correctAnswer: '4',
        color: '#8E90F5',
    },
    answerCrossesAxis: {
        defaultValue: '',
        type: 'select',
        label: 'Which axis answer',
        description: 'Student answer naming the axis a solution is read from',
        placeholder: '???',
        correctAnswer: 'x-axis',
        options: ['x-axis', 'y-axis'],
        color: '#8E90F5',
    },

    // ─────────────────────────────────────────────────────────────
    // Section 3 — Checking It Without the Picture
    // ─────────────────────────────────────────────────────────────
    testValue: {
        defaultValue: 1,
        type: 'number',
        label: 'Test value',
        description: 'The value of x fed into the expression 3x + 12',
        min: -8,
        max: 8,
        step: 0.5,
        color: '#62D0AD',
    },
    machineHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Machine figure highlight',
        description: 'Shared highlight key linking prose to the substitution machine',
        color: '#8E90F5',
        bgColor: 'rgba(142, 144, 245, 0.22)',
    },
    answerMachineRoot: {
        defaultValue: '',
        type: 'text',
        label: 'Machine root answer',
        description: 'Student answer for the solution of 3x + 12 = 0',
        placeholder: '???',
        correctAnswer: ['-4', '- 4', 'x = -4'],
        color: '#8E90F5',
    },
    answerSolveFiveX: {
        defaultValue: '',
        type: 'text',
        label: 'Solve 5x - 20 answer',
        description: 'Student answer for the solution of 5x - 20 = 0',
        placeholder: '???',
        correctAnswer: ['4', 'x = 4'],
        color: '#8E90F5',
    },

    // ─────────────────────────────────────────────────────────────
    // Section 4 — When the Line Bends
    // ─────────────────────────────────────────────────────────────
    vertexX: {
        defaultValue: 3,
        type: 'number',
        label: 'Lowest point across',
        description: 'Horizontal position of the parabola vertex',
        min: 0,
        max: 4,
        step: 1,
        color: '#62D0AD',
    },
    vertexY: {
        defaultValue: -4,
        type: 'number',
        label: 'Lowest point height',
        description: 'Height of the parabola vertex above the platform',
        unit: 'm',
        min: -6,
        max: 4,
        step: 1,
        color: '#62D0AD',
    },
    parabolaHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Parabola figure highlight',
        description: 'Shared highlight key linking prose to the curve figure',
        color: '#8E90F5',
        bgColor: 'rgba(142, 144, 245, 0.22)',
    },
    answerRootCount: {
        defaultValue: '',
        type: 'select',
        label: 'Number of solutions answer',
        description: 'Student answer for how many solutions a curve above the axis has',
        placeholder: '???',
        correctAnswer: 'none',
        options: ['none', 'one', 'two'],
        color: '#8E90F5',
    },
    answerOtherRoot: {
        defaultValue: '',
        type: 'text',
        label: 'Second root answer',
        description: 'Student answer for the second solution of a symmetric parabola',
        placeholder: '???',
        correctAnswer: ['6', 'x = 6'],
        color: '#8E90F5',
    },

    // ─────────────────────────────────────────────────────────────
    // Section 5 — Two Answers, One Equation
    // ─────────────────────────────────────────────────────────────
    hunterX: {
        defaultValue: -2.5,
        type: 'number',
        label: 'Probe position',
        description: 'The x value being probed in the hidden-curve hunt',
        min: -2.6,
        max: 4.6,
        step: 0.1,
        color: '#62D0AD',
    },
    foundRootLeft: {
        defaultValue: false,
        type: 'boolean',
        label: 'Left root found',
        description: 'Whether the student has landed on the left-hand solution',
    },
    foundRootRight: {
        defaultValue: false,
        type: 'boolean',
        label: 'Right root found',
        description: 'Whether the student has landed on the right-hand solution',
    },
    hunterResetCount: {
        defaultValue: 0,
        type: 'number',
        label: 'Hunt reset count',
        description: 'Increments whenever the root hunt figure is reset, clearing the trail',
        min: 0,
        max: 999,
        step: 1,
    },
    hunterHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Hunt figure highlight',
        description: 'Shared highlight key linking prose to the root hunt figure',
        color: '#8E90F5',
        bgColor: 'rgba(142, 144, 245, 0.22)',
    },
    answerMixedLinear: {
        defaultValue: '',
        type: 'text',
        label: 'Mixed practice linear answer',
        description: 'Student answer for the solution of 2x - 10 = 0',
        placeholder: '???',
        correctAnswer: ['5', 'x = 5'],
        color: '#8E90F5',
    },
    answerMixedQuadratic: {
        defaultValue: '',
        type: 'text',
        label: 'Mixed practice quadratic answer',
        description: 'Student answer for the negative solution of x squared minus 4 equals zero',
        placeholder: '???',
        correctAnswer: ['-2', '- 2', 'x = -2'],
        color: '#8E90F5',
    },
    answerHowManyLinear: {
        defaultValue: '',
        type: 'select',
        label: 'Linear solution count answer',
        description: 'Student answer for how many times a sloping straight line crosses zero',
        placeholder: '???',
        correctAnswer: 'once',
        options: ['never', 'once', 'twice'],
        color: '#8E90F5',
    },
};

/**
 * Get all variable names (for AI agents to discover)
 */
export const getVariableNames = (): string[] => {
    return Object.keys(variableDefinitions);
};

/**
 * Get a variable's default value
 */
export const getDefaultValue = (name: string): VarValue => {
    return variableDefinitions[name]?.defaultValue ?? 0;
};

/**
 * Get a variable's metadata
 */
export const getVariableInfo = (name: string): VariableDefinition | undefined => {
    return variableDefinitions[name];
};

/**
 * Get all default values as a record (for initialization)
 */
export const getDefaultValues = (): Record<string, VarValue> => {
    const defaults: Record<string, VarValue> = {};
    for (const [name, def] of Object.entries(variableDefinitions)) {
        defaults[name] = def.defaultValue;
    }
    return defaults;
};

/**
 * Get number props for InlineScrubbleNumber from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
export function numberPropsFromDefinition(def: VariableDefinition | undefined): {
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    color?: string;
} {
    if (!def || def.type !== 'number') return {};
    return {
        defaultValue: def.defaultValue as number,
        min: def.min,
        max: def.max,
        step: def.step,
        ...(def.color ? { color: def.color } : {}),
    };
}

/**
 * Get cloze input props for InlineClozeInput from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
/**
 * Get cloze choice props for InlineClozeChoice from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function choicePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Get toggle props for InlineToggle from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function togglePropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

export function clozePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
    caseSensitive?: boolean;
} {
    if (!def || def.type !== 'text') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
        ...(def.caseSensitive !== undefined ? { caseSensitive: def.caseSensitive } : {}),
    };
}

/**
 * Get spot-color props for InlineSpotColor from a variable definition.
 * Extracts the `color` field.
 *
 * @example
 * <InlineSpotColor
 *     varName="radius"
 *     {...spotColorPropsFromDefinition(getVariableInfo('radius'))}
 * >
 *     radius
 * </InlineSpotColor>
 */
export function spotColorPropsFromDefinition(def: VariableDefinition | undefined): {
    color: string;
} {
    return {
        color: def?.color ?? '#8B5CF6',
    };
}

/**
 * Get linked-highlight props for InlineLinkedHighlight from a variable definition.
 * Extracts the `color` and `bgColor` fields.
 *
 * @example
 * <InlineLinkedHighlight
 *     varName="activeHighlight"
 *     highlightId="radius"
 *     {...linkedHighlightPropsFromDefinition(getVariableInfo('activeHighlight'))}
 * >
 *     radius
 * </InlineLinkedHighlight>
 */
export function linkedHighlightPropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    return {
        ...(def?.color ? { color: def.color } : {}),
        ...(def?.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Build the `variables` prop for FormulaBlock from variable definitions.
 *
 * Takes an array of variable names and returns the config map expected by
 * `<FormulaBlock variables={...} />`.
 *
 * @example
 * import { scrubVarsFromDefinitions } from './variables';
 *
 * <FormulaBlock
 *     latex="\scrub{mass} \times \scrub{accel}"
 *     variables={scrubVarsFromDefinitions(['mass', 'accel'])}
 * />
 */
export function scrubVarsFromDefinitions(
    varNames: string[],
): Record<string, { min?: number; max?: number; step?: number; color?: string }> {
    const result: Record<string, { min?: number; max?: number; step?: number; color?: string }> = {};
    for (const name of varNames) {
        const def = variableDefinitions[name];
        if (!def) continue;
        result[name] = {
            ...(def.min !== undefined ? { min: def.min } : {}),
            ...(def.max !== undefined ? { max: def.max } : {}),
            ...(def.step !== undefined ? { step: def.step } : {}),
            ...(def.color ? { color: def.color } : {}),
        };
    }
    return result;
}
