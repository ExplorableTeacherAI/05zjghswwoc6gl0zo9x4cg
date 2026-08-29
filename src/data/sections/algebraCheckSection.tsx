import React, { useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineLinkedHighlight,
    InlineClozeInput,
    InlineFeedback,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp } from "@/lib/motion";
import {
    getVariableInfo,
    clozePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
} from "../variables";
import { ACCENT, ANSWER, HandleShadow, INK, INK_QUIET, INK_STRUCTURE, snap, VIEW_WIDTH } from "./equationsPlot";

// ── Domain model: the expression the machine evaluates ───────────────────────

const COEFFICIENT = 3;
const CONSTANT = 12;
const X_MIN = -8;
const X_MAX = 8;
const DEFAULT_X = 1;

const evaluate = (x: number) => COEFFICIENT * x + CONSTANT;

// ── View constants ───────────────────────────────────────────────────────────

const MACHINE_HEIGHT = 300;
const AXIS_LEFT = 56;
const AXIS_RIGHT = 524;
const NUMBER_LINE_Y = 236;
const BAR_ZERO_X = 260;
const BAR_TOP = 100;
const BAR_HEIGHT = 38;
const PIXELS_PER_VALUE = 6.5;
const pixelsPerX = (AXIS_RIGHT - AXIS_LEFT) / (X_MAX - X_MIN);

const toPixelX = (x: number) => AXIS_LEFT + (x - X_MIN) * pixelsPerX;
const toValueX = (px: number) => X_MIN + (px - AXIS_LEFT) / pixelsPerX;

function SubstitutionMachineDrawing() {
    const setVar = useSetVar();
    const x = useVar<number>("testValue", DEFAULT_X);
    const highlight = useVar<string>("machineHighlight", "");

    const [dragging, setDragging] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const value = evaluate(x);
    const isZero = Math.abs(value) < 1e-9;
    const barActive = highlight === "bar";
    const dim = highlight && !barActive ? 0.38 : 1;

    const barEnd = BAR_ZERO_X + value * PIXELS_PER_VALUE;
    const barLeft = Math.min(BAR_ZERO_X, barEnd);
    const barWidth = Math.abs(value) * PIXELS_PER_VALUE;
    const markerX = toPixelX(x);

    const pointerX = (event: React.PointerEvent) => {
        const svg = svgRef.current;
        if (!svg) return x;
        const rect = svg.getBoundingClientRect();
        return toValueX(((event.clientX - rect.left) / rect.width) * VIEW_WIDTH);
    };

    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!dragging) return;
        setVar("testValue", clamp(snap(pointerX(event), 0.5), X_MIN, X_MAX));
    };

    const ticks: number[] = [];
    for (let t = X_MIN; t <= X_MAX; t += 1) ticks.push(t);

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${MACHINE_HEIGHT}`}
            className="block w-full"
            role="img"
            aria-label="A machine that evaluates three x plus twelve for a value of x you choose"
        >
            <defs>
                <HandleShadow id="algebra-check-handle-shadow" />
            </defs>

            {/* Live substitution — the prerequisite skill, shown in full */}
            <g fontSize="15" style={{ fontVariantNumeric: "tabular-nums" }}>
                <text x="32" y="36" fill={INK}>
                    {`${COEFFICIENT} × (${x.toFixed(1)}) + ${CONSTANT} =`}
                </text>
                <text x="222" y="36" fill={isZero ? ANSWER : INK} fontWeight="600">
                    {value.toFixed(1)}
                </text>
                <text x="528" y="36" textAnchor="end" fontSize="13" fill={isZero ? ANSWER : INK_STRUCTURE} fontWeight={isZero ? 600 : 400}>
                    {isZero ? "zero reached" : "not zero yet"}
                </text>
            </g>

            {/* The value bar, measured against the zero line */}
            <g
                opacity={dim}
                style={{ transition: "opacity 150ms ease-out" }}
                onPointerEnter={() => setVar("machineHighlight", "bar")}
                onPointerLeave={() => setVar("machineHighlight", "")}
            >
                {barActive && barWidth > 0 && (
                    <rect
                        x={barLeft - 4}
                        y={BAR_TOP - 4}
                        width={barWidth + 8}
                        height={BAR_HEIGHT + 8}
                        rx="8"
                        fill={ACCENT}
                        opacity="0.28"
                    />
                )}
                <rect
                    x={barLeft}
                    y={BAR_TOP}
                    width={barWidth}
                    height={BAR_HEIGHT}
                    rx="4"
                    fill={ACCENT}
                    opacity={barActive ? 0.95 : 0.75}
                    style={{ transition: "opacity 150ms ease-out" }}
                />
                <text
                    x={value >= 0 ? barEnd + 8 : barEnd - 8}
                    y={BAR_TOP + 25}
                    textAnchor={value >= 0 ? "start" : "end"}
                    fontSize="13"
                    fontWeight="600"
                    fill={isZero ? ANSWER : INK}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {value.toFixed(1)}
                </text>
            </g>

            {/* The zero line the bar is being pushed toward */}
            <line
                x1={BAR_ZERO_X}
                y1={BAR_TOP - 20}
                x2={BAR_ZERO_X}
                y2={BAR_TOP + BAR_HEIGHT + 20}
                stroke={isZero ? ANSWER : INK_STRUCTURE}
                strokeWidth={isZero ? 3.5 : 2}
                strokeLinecap="round"
                style={{ transition: "stroke-width 150ms ease-out" }}
            />
            <text x={BAR_ZERO_X} y={BAR_TOP - 28} textAnchor="middle" fontSize="12" fill={isZero ? ANSWER : INK_STRUCTURE}>
                zero
            </text>

            {/* The number line the student drags along */}
            <g opacity={dim} style={{ transition: "opacity 150ms ease-out" }}>
                <line
                    x1={AXIS_LEFT}
                    y1={NUMBER_LINE_Y}
                    x2={AXIS_RIGHT}
                    y2={NUMBER_LINE_Y}
                    stroke={INK_STRUCTURE}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                {ticks.map((t) => (
                    <line
                        key={`tick-${t}`}
                        x1={toPixelX(t)}
                        y1={NUMBER_LINE_Y - 5}
                        x2={toPixelX(t)}
                        y2={NUMBER_LINE_Y + 5}
                        stroke={INK_QUIET}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                ))}
                {ticks.filter((t) => t % 2 === 0).map((t) => (
                    <text
                        key={`tick-label-${t}`}
                        x={toPixelX(t)}
                        y={NUMBER_LINE_Y + 22}
                        textAnchor="middle"
                        fontSize="11"
                        fill={INK_STRUCTURE}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {t}
                    </text>
                ))}
                <text x="32" y={MACHINE_HEIGHT - 12} fontSize="11" fill={INK_STRUCTURE}>
                    drag the teal marker to try a value of x
                </text>
            </g>

            {/* Draggable x marker */}
            <g opacity={dim} style={{ transition: "opacity 150ms ease-out" }}>
                <line
                    x1={markerX}
                    y1={BAR_TOP + BAR_HEIGHT + 22}
                    x2={markerX}
                    y2={NUMBER_LINE_Y - 12}
                    stroke={ACCENT}
                    strokeWidth="2"
                    strokeDasharray="4 5"
                    strokeLinecap="round"
                />
                <circle cx={markerX} cy={NUMBER_LINE_Y} r="10" fill={ACCENT} filter="url(#algebra-check-handle-shadow)" />
                <text
                    x={markerX}
                    y={NUMBER_LINE_Y + 40}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill={ACCENT}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {`x = ${x.toFixed(1)}`}
                </text>
                <circle
                    cx={markerX}
                    cy={NUMBER_LINE_Y}
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
            </g>
        </svg>
    );
}

function SubstitutionMachineFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="algebra-check-machine"
            onReset={() => {
                setVar("testValue", DEFAULT_X);
                setVar("machineHighlight", "");
            }}
            caption="Feed a value of x into 3x + 12. The teal bar measures how far the answer sits from zero, so the solution is the one place the bar disappears."
        >
            <SubstitutionMachineDrawing />
            <InteractionHintSequence
                hintKey="algebra-check-drag"
                steps={[
                    {
                        gesture: "drag-horizontal",
                        label: "Drag the teal marker left along the number line",
                        position: { x: "60%", y: "79%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: 26, y: 0 },
                            endOffset: { x: -26, y: 0 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export const algebraCheckSectionBlocks: ReactElement[] = [
    <StackLayout key="layout-algebra-check-heading" maxWidth="xl">
        <Block id="algebra-check-heading" padding="md">
            <EditableH2 id="h2-algebra-check-heading" blockId="algebra-check-heading">
                Checking It Without the Picture
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-algebra-check-setup" maxWidth="xl">
        <Block id="algebra-check-setup" padding="sm">
            <EditableParagraph id="para-algebra-check-setup" blockId="algebra-check-setup">
                A graph is quick, but you will not always be handed one. Behind every
                line sits an expression you can test by hand, so drag the teal marker to
                feed a value into 3x + 12 and watch the{" "}
                <InlineLinkedHighlight
                    varName="machineHighlight"
                    highlightId="bar"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("machineHighlight"))}
                >
                    teal bar
                </InlineLinkedHighlight>{" "}
                shrink toward zero.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-algebra-check-figure" maxWidth="xl">
        <Block id="algebra-check-machine" padding="sm" hasVisualization>
            <SubstitutionMachineFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-algebra-check-practice-find" maxWidth="xl">
        <Block id="algebra-check-practice-find" padding="sm">
            <EditableParagraph id="para-algebra-check-practice-find" blockId="algebra-check-practice-find">
                Hunt until the bar vanishes. The one value of x that makes 3x + 12 equal
                zero is x ={" "}
                <InlineFeedback
                    varName="answerMachineRoot"
                    correctValue={["-4", "- 4", "x = -4"]}
                    position="terminal"
                    successMessage="— found it, and notice you had to go left of zero to get there"
                    failureMessage="— keep hunting."
                    hint="The bar is still too long, so try a value further to the left"
                    visualizationHint={{
                        blockId: "algebra-check-machine",
                        hintKey: "algebra-check-feedback-hint",
                        label: "Discover it yourself",
                        resetVars: { testValue: 1, machineHighlight: "" },
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the marker left until the teal bar disappears completely",
                                position: { x: "60%", y: "79%" },
                                completionVar: "testValue",
                                completionValue: -4,
                                completionTolerance: 0.4,
                            },
                        ],
                    }}
                >
                    <InlineClozeInput
                        varName="answerMachineRoot"
                        correctAnswer={["-4", "- 4", "x = -4"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerMachineRoot"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-algebra-check-reflect" maxWidth="xl">
        <Block id="algebra-check-reflect" padding="sm">
            <EditableParagraph id="para-algebra-check-reflect" blockId="algebra-check-reflect">
                Landing exactly on zero by dragging is fiddly, and algebra gets there in
                two moves. Take the 12 off both sides, then share what is left equally
                between the 3 lots of x.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-algebra-check-working" maxWidth="xl">
        <Block id="algebra-check-working" padding="lg">
            <FormulaBlock latex="3x + 12 = 0 \quad\Rightarrow\quad 3x = -12 \quad\Rightarrow\quad x = -4" />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-algebra-check-practice-solve" maxWidth="xl">
        <Block id="algebra-check-practice-solve" padding="sm">
            <EditableParagraph id="para-algebra-check-practice-solve" blockId="algebra-check-practice-solve">
                Now try the same two moves on a different line. The graph of 5x - 20
                meets zero at x ={" "}
                <InlineFeedback
                    varName="answerSolveFiveX"
                    correctValue={["4", "x = 4"]}
                    position="terminal"
                    successMessage="— exactly, adding 20 to both sides gives 5x = 20, and one lot of x is 4"
                    failureMessage="— almost."
                    hint="Move the 20 across first, then split 20 into 5 equal lots"
                >
                    <InlineClozeInput
                        varName="answerSolveFiveX"
                        correctAnswer={["4", "x = 4"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerSolveFiveX"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
