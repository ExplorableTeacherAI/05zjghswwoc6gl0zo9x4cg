import React, { useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineLinkedHighlight,
    InlineFormula,
    InlineTooltip,
    InlineTrigger,
    InlineClozeInput,
    InlineClozeChoice,
    InlineFeedback,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp } from "@/lib/motion";
import {
    getVariableInfo,
    clozePropsFromDefinition,
    choicePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
} from "../variables";
import {
    ACCENT,
    ANSWER,
    CURVE_HUE,
    HandleShadow,
    INK,
    INK_STRUCTURE,
    PLOT_BOTTOM,
    PLOT_LEFT,
    PLOT_RIGHT,
    PLOT_TOP,
    PlotAxes,
    VIEW_HEIGHT,
    VIEW_WIDTH,
    fmt1,
    makeScale,
    snap,
    svgPoint,
} from "./equationsPlot";

// ── Domain model ─────────────────────────────────────────────────────────────

const DEFAULT_VERTEX_X = 3;
const DEFAULT_VERTEX_Y = -4;
const VERTEX_X_MIN = 0;
const VERTEX_X_MAX = 4;
const VERTEX_Y_MIN = -6;
const VERTEX_Y_MAX = 4;

const scale = makeScale({ xMin: -3, xMax: 8, yMin: -9, yMax: 7 });

/** The curve itself is drawn in a soft red, distinct from the teal drag handle. */
const CURVE = CURVE_HUE;

/** Vertex form (x - h)^2 + k written out as x^2 + bx + c = 0. */
function expandedExpression(h: number, k: number): string {
    const b = -2 * h;
    const c = h * h + k;
    const bTerm = b === 0 ? "" : ` ${b < 0 ? "-" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}x`;
    const cTerm = c === 0 ? "" : ` ${c < 0 ? "-" : "+"} ${Math.abs(c)}`;
    return `x²${bTerm}${cTerm}`;
}

function rootsOf(h: number, k: number): number[] {
    if (k > 0) return [];
    if (k === 0) return [h];
    const spread = Math.sqrt(-k);
    return [h - spread, h + spread];
}

function ParabolaDrawing() {
    const setVar = useSetVar();
    const h = useVar<number>("vertexX", DEFAULT_VERTEX_X);
    const k = useVar<number>("vertexY", DEFAULT_VERTEX_Y);
    const highlight = useVar<string>("parabolaHighlight", "");

    const [dragging, setDragging] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const rootsActive = highlight === "roots";
    const dim = highlight && !rootsActive ? 0.38 : 1;

    const roots = rootsOf(h, k);
    const countLabel =
        roots.length === 2 ? "2 solutions" : roots.length === 1 ? "1 solution" : "no solutions";

    // The curve is sampled from the model, never hand-drawn.
    const samples: string[] = [];
    for (let i = 0; i <= 220; i += 1) {
        const x = scale.domain.xMin + (i / 220) * (scale.domain.xMax - scale.domain.xMin);
        const y = (x - h) * (x - h) + k;
        samples.push(`${scale.toPixelX(x).toFixed(2)},${scale.toPixelY(y).toFixed(2)}`);
    }

    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!dragging) return;
        const point = svgPoint(svgRef.current, event);
        setVar("vertexX", clamp(snap(scale.toValueX(point.x), 1), VERTEX_X_MIN, VERTEX_X_MAX));
        setVar("vertexY", clamp(snap(scale.toValueY(point.y), 1), VERTEX_Y_MIN, VERTEX_Y_MAX));
    };

    const vertexPixel = { x: scale.toPixelX(h), y: scale.toPixelY(k) };

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full"
            role="img"
            aria-label="A curved height graph whose lowest point can be dragged anywhere"
        >
            <defs>
                <HandleShadow id="quadratic-roots-handle-shadow" />
                <clipPath id="quadratic-roots-clip">
                    <rect
                        x={PLOT_LEFT}
                        y={PLOT_TOP}
                        width={PLOT_RIGHT - PLOT_LEFT}
                        height={PLOT_BOTTOM - PLOT_TOP}
                    />
                </clipPath>
            </defs>

            <g fontSize="13" style={{ fontVariantNumeric: "tabular-nums" }}>
                <text x="32" y="30" fill={INK} opacity={dim}>
                    <tspan fill={CURVE} fontWeight="600">{expandedExpression(h, k)}</tspan>
                    <tspan>{" = 0"}</tspan>
                </text>
                <text x="528" y="30" fill={ANSWER} textAnchor="end" fontWeight="600">
                    {countLabel}
                </text>
            </g>

            <PlotAxes
                scale={scale}
                xStride={1}
                yStride={2}
                xLabel="time (s)"
                yLabel="height above platform (m)"
                dim={dim}
            />

            <g clipPath="url(#quadratic-roots-clip)">
                <g opacity={dim} style={{ transition: "opacity 150ms ease-out" }}>
                    <polyline
                        points={samples.join(" ")}
                        fill="none"
                        stroke={CURVE}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </g>

            </g>

                {/* The solutions: every place the curve meets zero */}
                <g
                    onPointerEnter={() => setVar("parabolaHighlight", "roots")}
                    onPointerLeave={() => setVar("parabolaHighlight", "")}
                >
                    {roots.map((root, index) => (
                        <g key={`root-${index}`}>
                            {rootsActive && (
                                <circle cx={scale.toPixelX(root)} cy={scale.toPixelY(0)} r="17" fill={ANSWER} opacity="0.28" />
                            )}
                            <circle
                                cx={scale.toPixelX(root)}
                                cy={scale.toPixelY(0)}
                                r={rootsActive ? 9 : 7}
                                fill={ANSWER}
                                style={{ transition: "r 150ms ease-out" }}
                            />
                            <text
                                x={scale.toPixelX(root)}
                                y={scale.toPixelY(0) + 40}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="600"
                                fill={ANSWER}
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {`x = ${fmt1(root)}`}
                            </text>
                        </g>
                    ))}
                </g>

            {/* Draggable vertex — the one thing the student controls */}
            <g opacity={dim} style={{ transition: "opacity 150ms ease-out" }}>
                <circle
                    cx={vertexPixel.x}
                    cy={vertexPixel.y}
                    r="9"
                    fill={ACCENT}
                    filter="url(#quadratic-roots-handle-shadow)"
                />
                <circle
                    cx={vertexPixel.x}
                    cy={vertexPixel.y}
                    r="24"
                    fill="transparent"
                    style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setDragging(true);
                    }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={() => setDragging(false)}
                    onPointerCancel={() => setDragging(false)}
                />
                <text x="32" y={VIEW_HEIGHT - 8} fontSize="11" fill={INK_STRUCTURE}>
                    drag the teal lowest point anywhere on the grid
                </text>
            </g>
        </svg>
    );
}

function ParabolaFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="quadratic-roots-figure"
            onReset={() => {
                setVar("vertexX", DEFAULT_VERTEX_X);
                setVar("vertexY", DEFAULT_VERTEX_Y);
                setVar("parabolaHighlight", "");
            }}
            caption="The drone dips below the platform and climbs back. Drag the teal lowest point and the indigo markers count every moment the height is exactly zero."
        >
            <ParabolaDrawing />
            <InteractionHintSequence
                hintKey="quadratic-roots-drag"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag the teal lowest point up and down",
                        position: { x: "56%", y: "70%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: 0, y: 20 },
                            endOffset: { x: 0, y: -24 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export const quadraticRootsSectionBlocks: ReactElement[] = [
    <StackLayout key="layout-quadratic-roots-heading" maxWidth="xl">
        <Block id="quadratic-roots-heading" padding="md">
            <EditableH2 id="h2-quadratic-roots-heading" blockId="quadratic-roots-heading">
                When the Line Bends
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-quadratic-roots-setup" maxWidth="xl">
        <Block id="quadratic-roots-setup" padding="sm">
            <EditableParagraph id="para-quadratic-roots-setup" blockId="quadratic-roots-setup">
                Now the drone dives and pulls back up, so the recorder bends into a
                curve. Drag the teal lowest point anywhere on the grid, and count the{" "}
                <InlineLinkedHighlight
                    varName="parabolaHighlight"
                    highlightId="roots"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("parabolaHighlight"))}
                >
                    indigo markers
                </InlineLinkedHighlight>{" "}
                that appear where the height is zero.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-quadratic-roots-figure" maxWidth="xl">
        <Block id="quadratic-roots-figure" padding="sm" hasVisualization>
            <ParabolaFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-quadratic-roots-insight" maxWidth="xl">
        <Block id="quadratic-roots-insight" padding="sm">
            <EditableParagraph id="para-quadratic-roots-insight" blockId="quadratic-roots-insight">
                <InlineTrigger
                    id="trigger-quadratic-roots-sink-below"
                    varName="vertexY"
                    value={-4}
                    color="#62D0AD"
                    bgColor="rgba(98, 208, 173, 0.15)"
                >
                    Sink the lowest point below the platform
                </InlineTrigger>{" "}
                and the drone passes zero twice, once going down and once coming back.{" "}
                <InlineTrigger
                    id="trigger-quadratic-roots-lift-above"
                    varName="vertexY"
                    value={2}
                    color="#62D0AD"
                    bgColor="rgba(98, 208, 173, 0.15)"
                >
                    Lift it above
                </InlineTrigger>{" "}
                and the drone never gets there at all. A{" "}
                <InlineTooltip
                    id="tooltip-quadratic-roots-quadratic-equation"
                    tooltip="A quadratic equation has x squared as its highest power, and its graph is a U-shaped curve."
                    color="#64748B"
                    bgColor="rgba(100, 116, 139, 0.14)"
                >
                    quadratic equation
                </InlineTooltip>{" "}
                can therefore have two solutions,{" "}
                <InlineTrigger
                    id="trigger-quadratic-roots-rest-on-zero"
                    varName="vertexY"
                    value={0}
                    color="#62D0AD"
                    bgColor="rgba(98, 208, 173, 0.15)"
                >
                    one
                </InlineTrigger>
                , or none.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-quadratic-roots-practice-count" maxWidth="xl">
        <Block id="quadratic-roots-practice-count" padding="sm">
            <EditableParagraph id="para-quadratic-roots-practice-count" blockId="quadratic-roots-practice-count">
                So if a curve sits entirely above the x-axis, the equation it comes from
                has{" "}
                <InlineFeedback
                    varName="answerRootCount"
                    correctValue="none"
                    position="mid"
                    hint="A solution needs the curve to actually touch zero"
                >
                    <InlineClozeChoice
                        varName="answerRootCount"
                        correctAnswer="none"
                        options={["none", "one", "two"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerRootCount"))}
                    />
                </InlineFeedback>{" "}
                solutions.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-quadratic-roots-practice-symmetry" maxWidth="xl">
        <Block id="quadratic-roots-practice-symmetry" padding="sm">
            <EditableParagraph id="para-quadratic-roots-practice-symmetry" blockId="quadratic-roots-practice-symmetry">
                A different flight has its lowest point at{" "}
                <InlineFormula
                    id="formula-quadratic-roots-symmetry-vertex"
                    latex="\clr{vertex}{x = 4}"
                    colorMap={{ vertex: "#62D0AD" }}
                />
                , and one of its solutions is{" "}
                <InlineFormula
                    id="formula-quadratic-roots-symmetry-root"
                    latex="\clr{root}{x = 2}"
                    colorMap={{ root: "#8E90F5" }}
                />
                . Because the curve is perfectly symmetrical about its
                lowest point, the other solution is x ={" "}
                <InlineFeedback
                    varName="answerOtherRoot"
                    correctValue={["6", "x = 6"]}
                    position="terminal"
                    successMessage="— exactly, 2 sits two steps left of 4, so the partner sits two steps right"
                    failureMessage="— not that one."
                    hint="Count how far 2 is from 4, then step the same distance the other way"
                    visualizationHint={{
                        blockId: "quadratic-roots-figure",
                        hintKey: "quadratic-roots-feedback-hint",
                        label: "Discover it yourself",
                        resetVars: { vertexX: 3, vertexY: -4, parabolaHighlight: "" },
                        steps: [
                            {
                                gesture: "drag",
                                label: "Drag the teal lowest point right until it sits at x = 4, then read both markers",
                                position: { x: "56%", y: "70%" },
                                completionVar: "vertexX",
                                completionValue: 4,
                                completionTolerance: 0.5,
                            },
                        ],
                    }}
                >
                    <InlineClozeInput
                        varName="answerOtherRoot"
                        correctAnswer={["6", "x = 6"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerOtherRoot"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
