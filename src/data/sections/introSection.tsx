import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH1, EditableParagraph, InlineFormula, InlineTooltip } from "@/components/atoms";

export const introSectionBlocks: ReactElement[] = [
    <StackLayout key="layout-intro-title" maxWidth="xl">
        <Block id="intro-title" padding="md">
            <EditableH1 id="h1-intro-title" blockId="intro-title">
                Solving Equations
            </EditableH1>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-intro-hook" maxWidth="xl">
        <Block id="intro-hook" padding="sm">
            <EditableParagraph id="para-intro-hook" blockId="intro-hook">
                A delivery drone lifts off from a cliff-top platform, and its flight
                recorder stores one thing: how high it is above that platform, second by
                second. Zero on that recorder is not nothing. Zero is the exact moment
                the drone is back level with the platform.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-intro-promise" maxWidth="xl">
        <Block id="intro-promise" padding="sm">
            <EditableParagraph id="para-intro-promise" blockId="intro-promise">
                Finding that moment is exactly what solving an equation means, and the
                graph shows you where to look. You already plot points, read{" "}
                <InlineFormula
                    id="formula-intro-straight-line"
                    latex="y = \clr{rate}{mx} + \clr{start}{c}"
                    colorMap={{ rate: "#F8A0CD", start: "#62D0AD" }}
                />{" "}
                as a straight line, and{" "}
                <InlineTooltip
                    id="tooltip-intro-substitute"
                    tooltip="Substituting means swapping the letter for a number and working out the result."
                    color="#64748B"
                    bgColor="rgba(100, 116, 139, 0.14)"
                >
                    substitute
                </InlineTooltip>{" "}
                numbers into expressions. From here
                you will read solutions straight off a graph, for straight lines first
                and then for curves that reach zero twice.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
