import React, { useEffect, useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineLinkedHighlight,
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
    HandleShadow,
    INK,
    INK_QUIET,
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

// ── Domain model: a curve the student cannot see ─────────────────────────────

const DEFAULT_PROBE = -2.5;
const PROBE_MIN = -2.6;
const PROBE_MAX = 4.6;
const ZERO_TOLERANCE = 0.12;
const LEFT_ROOT = -1;
const RIGHT_ROOT = 3;

const height = (x: number) => x * x - 2 * x - 3;

const scale = makeScale({ xMin: -3, xMax: 5, yMin: -6, yMax: 10 });

function RootHuntDrawing() {
    const setVar = useSetVar();
    const probe = useVar<number>("hunterX", DEFAULT_PROBE);
    const foundLeft = useVar<boolean>("foundRootLeft", false);
    const foundRight = useVar<boolean>("foundRootRight", false);
    const highlight = useVar<string>("hunterHighlight", "");
    const resetCount = useVar<number>("hunterResetCount", 0);

    const [dragging, setDragging] = useState(false);
    const [visited, setVisited] = useState<number[]>([]);
    const svgRef = useRef<SVGSVGElement>(null);

    // The reset control bumps a counter; the uncovered trail clears with it.
    useEffect(() => {
        setVisited([]);
    }, [resetCount]);

    const pinsActive = highlight === "pins";
    const dim = highlight && !pinsActive ? 0.38 : 1;

    const value = height(probe);
    const bothFound = foundLeft && foundRight;
    const foundCount = (foundLeft ? 1 : 0) + (foundRight ? 1 : 0);

    const recordVisit = (x: number) => {
        const key = Math.round(x * 10) / 10;
        setVisited((previous) => (previous.includes(key) ? previous : [...previous, key]));
        if (Math.abs(height(key)) < ZERO_TOLERANCE) {
            setVar(key < 1 ? "foundRootLeft" : "foundRootRight", true);
        }
    };

    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!dragging) return;
        const point = svgPoint(svgRef.current, event);
        const next = clamp(snap(scale.toValueX(point.x), 0.1), PROBE_MIN, PROBE_MAX);
        setVar("hunterX", next);
        recordVisit(next);
    };

    // The full curve, revealed only once both solutions are pinned.
    const samples: string[] = [];
    for (let i = 0; i <= 220; i += 1) {
        const x = scale.domain.xMin + (i / 220) * (scale.domain.xMax - scale.domain.xMin);
        samples.push(`${scale.toPixelX(x).toFixed(2)},${scale.toPixelY(height(x)).toFixed(2)}`);
    }

    const probeX = scale.toPixelX(probe);
    const probeY = scale.toPixelY(value);
    const axisY = scale.toPixelY(0);
    const pins = [
        { x: LEFT_ROOT, found: foundLeft },
        { x: RIGHT_ROOT, found: foundRight },
    ].filter((pin) => pin.found);

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="block w-full"
            role="img"
            aria-label="A hidden curve you uncover by dragging a probe along the axis"
        >
            <defs>
                <HandleShadow id="root-hunt-handle-shadow" />
                <clipPath id="root-hunt-clip">
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
                    {`x² - 2x - 3 = ${fmt1(value)}`}
                </text>
                <text x="528" y="30" fill={ANSWER} textAnchor="end" fontWeight="600">
                    {bothFound ? "both solutions found" : `${foundCount} of 2 found`}
                </text>
            </g>

            <PlotAxes
                scale={scale}
                xStride={1}
                yStride={2}
                xLabel="value of x"
                yLabel="height above platform (m)"
                dim={dim}
            />

            <g clipPath="url(#root-hunt-clip)">
                {/* The reward: the curve appears once both solutions are pinned */}
                {bothFound && (
                    <polyline
                        points={samples.join(" ")}
                        fill="none"
                        stroke={ACCENT}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={dim * 0.5}
                        style={{ transition: "opacity 300ms ease-out" }}
                    />
                )}

                {/* The trail of everywhere the student has already probed */}
                <g opacity={dim} style={{ transition: "opacity 150ms ease-out" }}>
                    {visited.map((x) => (
                        <circle
                            key={`visit-${x}`}
                            cx={scale.toPixelX(x)}
                            cy={scale.toPixelY(height(x))}
                            r="2.5"
                            fill={INK_QUIET}
                        />
                    ))}
                </g>

                {/* Where the curve actually is, right now */}
                <g opacity={dim} style={{ transition: "opacity 150ms ease-out" }}>
                    <line
                        x1={probeX}
                        y1={axisY}
                        x2={probeX}
                        y2={probeY}
                        stroke={ACCENT}
                        strokeWidth="2"
                        strokeDasharray="4 5"
                        strokeLinecap="round"
                    />
                    <circle cx={probeX} cy={probeY} r="7" fill={ACCENT} />
                    <text
                        x={clamp(probeX, PLOT_LEFT + 24, PLOT_RIGHT - 24)}
                        y={probeY - 14}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="600"
                        fill={ACCENT}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {fmt1(value)}
                    </text>
                </g>

            </g>

                {/* Pinned solutions */}
                <g
                    onPointerEnter={() => setVar("hunterHighlight", "pins")}
                    onPointerLeave={() => setVar("hunterHighlight", "")}
                >
                    {pins.map((pin) => (
                        <g key={`pin-${pin.x}`}>
                            {pinsActive && (
                                <circle cx={scale.toPixelX(pin.x)} cy={axisY} r="17" fill={ANSWER} opacity="0.28" />
                            )}
                            <circle
                                cx={scale.toPixelX(pin.x)}
                                cy={axisY}
                                r={pinsActive ? 9 : 7}
                                fill={ANSWER}
                                style={{ transition: "r 150ms ease-out" }}
                            />
                            <text
                                x={scale.toPixelX(pin.x)}
                                y={axisY + 40}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="600"
                                fill={ANSWER}
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {`x = ${fmt1(pin.x)}`}
                            </text>
                        </g>
                    ))}
                </g>

            {/* The draggable probe, riding the x-axis */}
            <g opacity={dim} style={{ transition: "opacity 150ms ease-out" }}>
                <circle cx={probeX} cy={axisY} r="10" fill={ACCENT} filter="url(#root-hunt-handle-shadow)" />
                <circle
                    cx={probeX}
                    cy={axisY}
                    r="24"
                    fill="transparent"
                    style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setDragging(true);
                        recordVisit(probe);
                    }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={() => setDragging(false)}
                    onPointerCancel={() => setDragging(false)}
                />
                <text x="32" y={VIEW_HEIGHT - 8} fontSize="11" fill={INK_STRUCTURE}>
                    drag the teal probe left and right along the axis
                </text>
            </g>
        </svg>
    );
}

function RootHuntFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="root-hunt-figure"
            onReset={() => {
                setVar("hunterX", DEFAULT_PROBE);
                setVar("foundRootLeft", false);
                setVar("foundRootRight", false);
                setVar("hunterHighlight", "");
                setVar("hunterResetCount", Date.now());
            }}
            caption="The curve for x² - 2x - 3 is hidden. Drag the teal probe and the dot shows the height at that value of x, so pin both places where the height is exactly zero."
        >
            <RootHuntDrawing />
            <InteractionHintSequence
                hintKey="root-hunt-drag"
                steps={[
                    {
                        gesture: "drag-horizontal",
                        label: "Drag the teal probe right and watch the height fall",
                        position: { x: "15%", y: "64%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: -22, y: 0 },
                            endOffset: { x: 30, y: 0 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export const mixedPracticeSectionBlocks: ReactElement[] = [
    <StackLayout key="layout-root-hunt-heading" maxWidth="xl">
        <Block id="root-hunt-heading" padding="md">
            <EditableH2 id="h2-root-hunt-heading" blockId="root-hunt-heading">
                Two Answers, One Equation
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-root-hunt-setup" maxWidth="xl">
        <Block id="root-hunt-setup" padding="sm">
            <EditableParagraph id="para-root-hunt-setup" blockId="root-hunt-setup">
                This flight comes with the curve switched off. Drag the teal probe along
                the axis and the dot shows how high x² - 2x - 3 really is at that moment.
                Pin both places where the height lands on exactly zero.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-root-hunt-figure" maxWidth="xl">
        <Block id="root-hunt-figure" padding="sm" hasVisualization>
            <RootHuntFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-root-hunt-insight" maxWidth="xl">
        <Block id="root-hunt-insight" padding="sm">
            <EditableParagraph id="para-root-hunt-insight" blockId="root-hunt-insight">
                The trail of grey dots you left behind is the curve, drawn by your own
                hunting. Two{" "}
                <InlineLinkedHighlight
                    varName="hunterHighlight"
                    highlightId="pins"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("hunterHighlight"))}
                >
                    pinned markers
                </InlineLinkedHighlight>
                , two solutions, and one of them sits on the negative side of zero.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-root-hunt-practice-linear" maxWidth="xl">
        <Block id="root-hunt-practice-linear" padding="sm">
            <EditableParagraph id="para-root-hunt-practice-linear" blockId="root-hunt-practice-linear">
                Back to straight lines for a moment. The graph of 2x - 10 meets zero at
                x ={" "}
                <InlineFeedback
                    varName="answerMixedLinear"
                    correctValue={["5", "x = 5"]}
                    position="terminal"
                    successMessage="— correct, 2x has to make up 10, so each x is worth 5"
                    failureMessage="— try once more."
                    hint="Move the 10 across, then split it into 2 equal lots"
                    reviewBlockId="algebra-check-working"
                    reviewLabel="Review the two moves"
                >
                    <InlineClozeInput
                        varName="answerMixedLinear"
                        correctAnswer={["5", "x = 5"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerMixedLinear"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-root-hunt-practice-quadratic" maxWidth="xl">
        <Block id="root-hunt-practice-quadratic" padding="sm">
            <EditableParagraph id="para-root-hunt-practice-quadratic" blockId="root-hunt-practice-quadratic">
                The curve x² - 4 dips below the axis and comes back, meeting zero at
                x = 2 and again at x ={" "}
                <InlineFeedback
                    varName="answerMixedQuadratic"
                    correctValue={["-2", "- 2", "x = -2"]}
                    position="terminal"
                    successMessage="— yes, its lowest point sits on the y-axis, so the two solutions are mirror images"
                    failureMessage="— not quite."
                    hint="This curve is symmetrical about x = 0, so where is the mirror image of 2?"
                    visualizationHint={{
                        blockId: "quadratic-roots-figure",
                        hintKey: "root-hunt-feedback-hint",
                        label: "Discover it yourself",
                        resetVars: { vertexX: 3, vertexY: -4, parabolaHighlight: "" },
                        steps: [
                            {
                                gesture: "drag",
                                label: "Drag the teal lowest point onto the y-axis at x = 0, then read the two markers",
                                position: { x: "56%", y: "70%" },
                                completionVar: "vertexX",
                                completionValue: 0,
                                completionTolerance: 0.5,
                            },
                        ],
                    }}
                >
                    <InlineClozeInput
                        varName="answerMixedQuadratic"
                        correctAnswer={["-2", "- 2", "x = -2"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerMixedQuadratic"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-root-hunt-practice-count" maxWidth="xl">
        <Block id="root-hunt-practice-count" padding="sm">
            <EditableParagraph id="para-root-hunt-practice-count" blockId="root-hunt-practice-count">
                And however you tilt it, a sloping straight line meets zero{" "}
                <InlineFeedback
                    varName="answerHowManyLinear"
                    correctValue="once"
                    position="mid"
                    hint="A straight line never turns around and comes back"
                    reviewBlockId="linear-root-figure"
                    reviewLabel="Try tilting the line again"
                >
                    <InlineClozeChoice
                        varName="answerHowManyLinear"
                        correctAnswer="once"
                        options={["never", "once", "twice"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerHowManyLinear"))}
                    />
                </InlineFeedback>{" "}
                on the way past.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
