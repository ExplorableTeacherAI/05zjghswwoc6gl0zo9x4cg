import React, { useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineScrubbleNumber,
    InlineLinkedHighlight,
    InlineFormula,
    InlineTooltip,
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
    numberPropsFromDefinition,
    clozePropsFromDefinition,
    choicePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
} from "../variables";
import {
    ACCENT,
    ANSWER,
    HandleShadow,
    INK,
    INK_STRUCTURE,
    PLOT_BOTTOM,
    PLOT_LEFT,
    PLOT_RIGHT,
    PLOT_TOP,
    PlotAxes,
    RATE_HUE,
    VIEW_HEIGHT,
    VIEW_WIDTH,
    fmt1,
    makeScale,
    snap,
    svgPoint,
} from "./equationsPlot";

// ── Domain model ─────────────────────────────────────────────────────────────

const DEFAULT_START = 6;
const DEFAULT_RATE = -2;
const START_MIN = -8;
const START_MAX = 6;
const RATE_MIN = -3;
const RATE_MAX = 3;
const TILT_HANDLE_X = 5; // seconds — where the tilt handle rides the line

const scale = makeScale({ xMin: -3, xMax: 8, yMin: -9, yMax: 7 });

/**
 * "-2x + 6 = 0" — the equation the picture is showing, in ordinary notation,
 * split into its terms so each one can carry the colour of the handle that sets it.
 */
function equationParts(rate: number, start: number): { gradient: string; sign: string; constant: string } {
    const gradient =
        rate === 1 ? "x" : rate === -1 ? "-x" : `${Number.isInteger(rate) ? rate : rate.toFixed(1)}x`;
    if (start === 0) return { gradient, sign: "", constant: "" };
    const size = Math.abs(start);
    return {
        gradient,
        sign: start < 0 ? " - " : " + ",
        constant: `${Number.isInteger(size) ? size : size.toFixed(1)}`,
    };
}

// ── The bespoke drawing ──────────────────────────────────────────────────────

function DroneLineDrawing() {
    const setVar = useSetVar();
    const start = useVar<number>("lineStartHeight", DEFAULT_START);
    const rate = useVar<number>("lineClimbRate", DEFAULT_RATE);
    const highlight = useVar<string>("lineHighlight", "");

    const [dragging, setDragging] = useState<"start" | "tilt" | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const rootActive = highlight === "root";
    const dim = highlight && !rootActive ? 0.38 : 1;
    const equation = equationParts(rate, start);

    const hasRoot = Math.abs(rate) > 1e-9;
    const rootX = hasRoot ? -start / rate : NaN;
    const rootVisible =
        hasRoot && rootX >= scale.domain.xMin + 0.5 && rootX <= scale.domain.xMax - 0.5;

    const lineFrom: [number, number] = [
        scale.domain.xMin,
        rate * scale.domain.xMin + start,
    ];
    const lineTo: [number, number] = [
        scale.domain.xMax,
        rate * scale.domain.xMax + start,
    ];

    const startHandle = { x: scale.toPixelX(0), y: scale.toPixelY(start) };
    const tiltHandle = {
        x: scale.toPixelX(TILT_HANDLE_X),
        y: scale.toPixelY(rate * TILT_HANDLE_X + start),
    };

    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!dragging) return;
        const point = svgPoint(svgRef.current, event);
        const value = scale.toValueY(point.y);
        if (dragging === "start") {
            setVar("lineStartHeight", clamp(snap(value, 0.5), START_MIN, START_MAX));
        } else {
            const nextRate = (value - start) / TILT_HANDLE_X;
            setVar("lineClimbRate", clamp(snap(nextRate, 0.5), RATE_MIN, RATE_MAX));
        }
    };

    const grabProps = (which: "start" | "tilt") => ({
        style: {
            cursor: dragging === which ? "grabbing" : "grab",
            touchAction: "none" as const,
        },
        onPointerDown: (event: React.PointerEvent<SVGCircleElement>) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(which);
        },
        onPointerMove: handlePointerMove,
        onPointerUp: () => setDragging(null),
        onPointerCancel: () => setDragging(null),
    });

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full"
            role="img"
            aria-label="A straight-line height graph with draggable start and tilt handles"
        >
            <defs>
                <HandleShadow id="linear-root-handle-shadow" />
                <clipPath id="linear-root-clip">
                    <rect
                        x={PLOT_LEFT}
                        y={PLOT_TOP}
                        width={PLOT_RIGHT - PLOT_LEFT}
                        height={PLOT_BOTTOM - PLOT_TOP}
                    />
                </clipPath>
            </defs>

            {/* Readouts, above the drawing surface, never over the plot */}
            <g fontSize="13" style={{ fontVariantNumeric: "tabular-nums" }}>
                <text x="32" y="30" fill={INK} opacity={dim}>
                    <tspan fill={RATE_HUE} fontWeight="600">{equation.gradient}</tspan>
                    <tspan>{equation.sign}</tspan>
                    <tspan fill={ACCENT} fontWeight="600">{equation.constant}</tspan>
                    <tspan>{" = 0"}</tspan>
                </text>
                <text x="528" y="30" fill={ANSWER} textAnchor="end" fontWeight="600">
                    {hasRoot ? `x = ${fmt1(rootX)}` : "never reaches 0"}
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

            <g clipPath="url(#linear-root-clip)">
                {/* The drone's height line — the manipulable object, accent hue */}
                <g opacity={dim} style={{ transition: "opacity 150ms ease-out" }}>
                    <line
                        x1={scale.toPixelX(lineFrom[0])}
                        y1={scale.toPixelY(lineFrom[1])}
                        x2={scale.toPixelX(lineTo[0])}
                        y2={scale.toPixelY(lineTo[1])}
                        stroke={ACCENT}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </g>

            </g>

                {/* The solution: where the line meets zero */}
                {rootVisible && (
                    <g
                        onPointerEnter={() => setVar("lineHighlight", "root")}
                        onPointerLeave={() => setVar("lineHighlight", "")}
                        style={{ transition: "opacity 150ms ease-out" }}
                    >
                        {rootActive && (
                            <circle
                                cx={scale.toPixelX(rootX)}
                                cy={scale.toPixelY(0)}
                                r="17"
                                fill={ANSWER}
                                opacity="0.28"
                            />
                        )}
                        <circle
                            cx={scale.toPixelX(rootX)}
                            cy={scale.toPixelY(0)}
                            r={rootActive ? 9 : 7}
                            fill={ANSWER}
                            style={{ transition: "r 150ms ease-out" }}
                        />
                        <text
                            x={scale.toPixelX(rootX)}
                            y={scale.toPixelY(0) + 40}
                            textAnchor="middle"
                            fontSize="12"
                            fontWeight="600"
                            fill={ANSWER}
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {`x = ${fmt1(rootX)}`}
                        </text>
                    </g>
                )}

            {/* Draggable handles — accent, shadowed, generous hit areas */}
            <g opacity={dim} style={{ transition: "opacity 150ms ease-out" }}>
                <circle
                    cx={startHandle.x}
                    cy={startHandle.y}
                    r="9"
                    fill={ACCENT}
                    filter="url(#linear-root-handle-shadow)"
                />
                <circle cx={startHandle.x} cy={startHandle.y} r="22" fill="transparent" {...grabProps("start")} />
                <circle
                    cx={tiltHandle.x}
                    cy={tiltHandle.y}
                    r="9"
                    fill={RATE_HUE}
                    filter="url(#linear-root-handle-shadow)"
                />
                <circle cx={tiltHandle.x} cy={tiltHandle.y} r="22" fill="transparent" {...grabProps("tilt")} />
                <text x="32" y={VIEW_HEIGHT - 8} fontSize="11" fill={INK_STRUCTURE}>
                    left dot moves the start · right dot tilts the climb
                </text>
            </g>
        </svg>
    );
}

function DroneLineFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="linear-root-figure"
            onReset={() => {
                setVar("lineStartHeight", DEFAULT_START);
                setVar("lineClimbRate", DEFAULT_RATE);
                setVar("lineHighlight", "");
            }}
            caption="The drone's height above the platform, second by second. Drag the teal or rose dot and the indigo marker shows the moment the height is exactly zero."
        >
            <DroneLineDrawing />
            <InteractionHintSequence
                hintKey="linear-root-drag"
                steps={[
                    {
                        gesture: "drag-vertical",
                        label: "Drag the teal dot to move the start",
                        position: { x: "33%", y: "21%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: 0, y: -22 },
                            endOffset: { x: 0, y: 22 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export const linearRootSectionBlocks: ReactElement[] = [
    <StackLayout key="layout-linear-root-heading" maxWidth="xl">
        <Block id="linear-root-heading" padding="md">
            <EditableH2 id="h2-linear-root-heading" blockId="linear-root-heading">
                Where the Line Hits Zero
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-linear-root-setup" maxWidth="xl">
        <Block id="linear-root-setup" padding="sm">
            <EditableParagraph id="para-linear-root-setup" blockId="linear-root-setup">
                A steady climb rate draws a straight line on the recorder. This flight
                starts at a height of{" "}
                <InlineScrubbleNumber
                    varName="lineStartHeight"
                    {...numberPropsFromDefinition(getVariableInfo("lineStartHeight"))}
                    formatValue={(v) => `${v} m`}
                />{" "}
                and holds a rate of{" "}
                <InlineScrubbleNumber
                    id="scrubble-linear-root-climb-rate"
                    varName="lineClimbRate"
                    {...numberPropsFromDefinition(getVariableInfo("lineClimbRate"))}
                    formatValue={(v) => `${v} m/s`}
                />
                . Drag the teal dot to change where the line starts or the rose dot to
                change how steeply it tilts, and watch the{" "}
                <InlineLinkedHighlight
                    varName="lineHighlight"
                    highlightId="root"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("lineHighlight"))}
                >
                    crossing point
                </InlineLinkedHighlight>{" "}
                slide along the bottom axis.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-linear-root-figure" maxWidth="xl">
        <Block id="linear-root-figure" padding="sm" hasVisualization>
            <DroneLineFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-linear-root-insight" maxWidth="xl">
        <Block id="linear-root-insight" padding="sm">
            <EditableParagraph id="para-linear-root-insight" blockId="linear-root-insight">
                That crossing point is the{" "}
                <InlineTooltip
                    id="tooltip-linear-root-solution"
                    tooltip="A solution is a value of x that makes the equation true. Here it is the moment the height equals zero."
                    color="#64748B"
                    bgColor="rgba(100, 116, 139, 0.14)"
                >
                    solution
                </InlineTooltip>
                . Whatever equation sits in the corner,
                the x value where the line meets zero is the answer to it, and a sloping
                straight line can only ever meet zero in one place.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-linear-root-practice-read" maxWidth="xl">
        <Block id="linear-root-practice-read" padding="sm">
            <EditableParagraph id="para-linear-root-practice-read" blockId="linear-root-practice-read">
                A second drone starts 4 m up and sinks 1 m every second, so its height
                follows{" "}
                <InlineFormula
                    id="formula-linear-root-second-drone"
                    latex="\clr{rate}{-x} + \clr{start}{4}"
                    colorMap={{ rate: "#F8A0CD", start: "#62D0AD" }}
                />
                . It is level with the platform when x ={" "}
                <InlineFeedback
                    varName="answerLineRoot"
                    correctValue={["4", "x = 4"]}
                    position="terminal"
                    successMessage="— spot on, the line runs out of height after 4 seconds"
                    failureMessage="— not yet."
                    hint="Set the graph to start at 4 and sink 1 m each second, then read the marker"
                    visualizationHint={{
                        blockId: "linear-root-figure",
                        hintKey: "linear-root-feedback-hint",
                        label: "Discover it yourself",
                        resetVars: { lineStartHeight: 4, lineClimbRate: -2, lineHighlight: "" },
                        steps: [
                            {
                                gesture: "drag-vertical",
                                label: "Drag the right-hand rose dot up until the drone sinks just 1 m each second",
                                position: { x: "71%", y: "78%" },
                                completionVar: "lineClimbRate",
                                completionValue: -1,
                                completionTolerance: 0.25,
                            },
                        ],
                    }}
                >
                    <InlineClozeInput
                        varName="answerLineRoot"
                        correctAnswer={["4", "x = 4"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerLineRoot"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-linear-root-practice-axis" maxWidth="xl">
        <Block id="linear-root-practice-axis" padding="sm">
            <EditableParagraph id="para-linear-root-practice-axis" blockId="linear-root-practice-axis">
                On any of these graphs, a solution is always read off the{" "}
                <InlineFeedback
                    varName="answerCrossesAxis"
                    correctValue="x-axis"
                    position="terminal"
                    successMessage="— yes, because that is the line where the height is zero"
                    failureMessage="— have another look."
                    hint="Which axis runs through every point whose height is zero?"
                >
                    <InlineClozeChoice
                        varName="answerCrossesAxis"
                        correctAnswer="x-axis"
                        options={["x-axis", "y-axis"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerCrossesAxis"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
