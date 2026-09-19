/**
 * Shared drawing helpers for the "Solving Equations" lesson figures.
 *
 * One coordinate frame, one ink palette, one set of axes — so the straight
 * line, the curve and the root hunt all read as the same world.
 */

import React from "react";

export const VIEW_WIDTH = 560;
export const VIEW_HEIGHT = 400;

export const PLOT_LEFT = 56;
export const PLOT_RIGHT = 524;
export const PLOT_TOP = 72;
export const PLOT_BOTTOM = 368;

export const INK = "#334155";
export const INK_STRUCTURE = "#64748B";
export const INK_QUIET = "#CBD5E1";
export const GRID = "#E2E8F0";
export const ACCENT = "#62D0AD";
export const ANSWER = "#8E90F5";

// One quantity, one colour, in every figure and every formula of the lesson.
export const HEIGHT_HUE = ACCENT;    // a height / the value of the expression (line, bar, probe dot)
export const ROOT_HUE = ANSWER;      // a solution: where the height is exactly zero
export const INPUT_HUE = "#F7B23B";  // the value of x being tried (machine marker, hunt probe)
export const RATE_HUE = "#F8A0CD";   // the climb rate (gradient term, tilt handle)
export const CURVE_HUE = "#ef4444";  // a quadratic curve and its expression

export interface PlotDomain {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}

export interface PlotScale {
    domain: PlotDomain;
    toPixelX: (x: number) => number;
    toPixelY: (y: number) => number;
    toValueX: (px: number) => number;
    toValueY: (py: number) => number;
}

export function makeScale(domain: PlotDomain): PlotScale {
    const spanX = domain.xMax - domain.xMin;
    const spanY = domain.yMax - domain.yMin;
    const width = PLOT_RIGHT - PLOT_LEFT;
    const height = PLOT_BOTTOM - PLOT_TOP;
    return {
        domain,
        toPixelX: (x) => PLOT_LEFT + ((x - domain.xMin) / spanX) * width,
        toPixelY: (y) => PLOT_TOP + ((domain.yMax - y) / spanY) * height,
        toValueX: (px) => domain.xMin + ((px - PLOT_LEFT) / width) * spanX,
        toValueY: (py) => domain.yMax - ((py - PLOT_TOP) / height) * spanY,
    };
}

/** Integer tick values inside a range, thinned so labels never collide. */
function ticks(min: number, max: number, stride: number): number[] {
    const out: number[] = [];
    const first = Math.ceil(min / stride) * stride;
    for (let v = first; v <= max + 1e-9; v += stride) out.push(Math.round(v));
    return out;
}

interface AxesProps {
    scale: PlotScale;
    xStride?: number;
    yStride?: number;
    xLabel?: string;
    yLabel?: string;
    /** Dims the whole axis layer while a linked highlight is active elsewhere. */
    dim?: number;
}

/**
 * Grid, axes and direct axis labels — quiet ink only, never competing with
 * the accent line the student is manipulating.
 */
export function PlotAxes({
    scale,
    xStride = 1,
    yStride = 2,
    xLabel,
    yLabel,
    dim = 1,
}: AxesProps) {
    const { domain, toPixelX, toPixelY } = scale;
    const zeroY = toPixelY(0);
    const zeroX = toPixelX(0);
    const xTicks = ticks(domain.xMin, domain.xMax, xStride);
    const yTicks = ticks(domain.yMin, domain.yMax, yStride);

    return (
        <g opacity={dim} style={{ transition: "opacity 150ms ease-out" }}>
            {/* Grid */}
            {xTicks.map((x) => (
                <line
                    key={`gx-${x}`}
                    x1={toPixelX(x)}
                    y1={PLOT_TOP}
                    x2={toPixelX(x)}
                    y2={PLOT_BOTTOM}
                    stroke={GRID}
                    strokeWidth="1"
                />
            ))}
            {yTicks.map((y) => (
                <line
                    key={`gy-${y}`}
                    x1={PLOT_LEFT}
                    y1={toPixelY(y)}
                    x2={PLOT_RIGHT}
                    y2={toPixelY(y)}
                    stroke={GRID}
                    strokeWidth="1"
                />
            ))}

            {/* Axes */}
            <line
                x1={PLOT_LEFT}
                y1={zeroY}
                x2={PLOT_RIGHT}
                y2={zeroY}
                stroke={INK_STRUCTURE}
                strokeWidth="2"
                strokeLinecap="round"
            />
            <line
                x1={zeroX}
                y1={PLOT_TOP}
                x2={zeroX}
                y2={PLOT_BOTTOM}
                stroke={INK_STRUCTURE}
                strokeWidth="2"
                strokeLinecap="round"
            />

            {/* Axis numbers */}
            <g fontSize="11" fill={INK_STRUCTURE} style={{ fontVariantNumeric: "tabular-nums" }}>
                {xTicks.filter((x) => x !== 0).map((x) => (
                    <text key={`tx-${x}`} x={toPixelX(x)} y={zeroY + 16} textAnchor="middle">
                        {x}
                    </text>
                ))}
                {yTicks.filter((y) => y !== 0).map((y) => (
                    <text key={`ty-${y}`} x={zeroX - 8} y={toPixelY(y) + 4} textAnchor="end">
                        {y}
                    </text>
                ))}
            </g>

            {/* Direct axis labels, anchored back toward the ink */}
            {xLabel && (
                <text x={PLOT_RIGHT} y={PLOT_BOTTOM + 24} textAnchor="end" fontSize="12" fill={INK}>
                    {xLabel}
                </text>
            )}
            {yLabel && (
                <text x={PLOT_LEFT} y={PLOT_TOP - 14} textAnchor="start" fontSize="12" fill={INK}>
                    {yLabel}
                </text>
            )}
        </g>
    );
}

/** Soft drop shadow used on draggable handles only. */
export function HandleShadow({ id }: { id: string }) {
    return (
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
        </filter>
    );
}

/** Converts a pointer event into viewBox coordinates for a given svg element. */
export function svgPoint(
    svg: SVGSVGElement | null,
    event: React.PointerEvent,
): { x: number; y: number } {
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
    };
}

/** Rounds to the nearest multiple of `step`. */
export function snap(value: number, step: number): number {
    return Math.round(value / step) * step;
}

/** One formatter per quantity: heights and solutions always show one decimal. */
export const fmt1 = (v: number): string => {
    const rounded = Math.abs(v) < 5e-3 ? 0 : v;
    return rounded.toFixed(1);
};

/** Signed term for building readable equations, e.g. "- 6x", "+ 5". */
export function signedTerm(coefficient: number, suffix: string): string {
    if (coefficient === 0) return "";
    const sign = coefficient < 0 ? "-" : "+";
    const size = Math.abs(coefficient);
    const shown = suffix && size === 1 ? "" : `${Number.isInteger(size) ? size : size.toFixed(1)}`;
    return ` ${sign} ${shown}${suffix}`;
}
