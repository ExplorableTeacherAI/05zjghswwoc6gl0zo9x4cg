import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph } from "@/components/atoms";

export const conclusionSectionBlocks: ReactElement[] = [
    <StackLayout key="layout-conclusion-heading" maxWidth="xl">
        <Block id="conclusion-heading" padding="md">
            <EditableH2 id="h2-conclusion-heading" blockId="conclusion-heading">
                Wrapping Up
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-conclusion-insight" maxWidth="xl">
        <Block id="conclusion-insight" padding="sm">
            <EditableParagraph id="para-conclusion-insight" blockId="conclusion-insight">
                So a solution was never really about shuffling letters around. It is a
                place on a graph, the one spot where the recorder reads zero, whether the
                flight drew a straight line or a curve. That is why a line hands you a
                single answer while a curve can hand you two, one, or none.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-conclusion-next" maxWidth="xl">
        <Block id="conclusion-next" padding="sm">
            <EditableParagraph id="para-conclusion-next" blockId="conclusion-next">
                The two algebra moves you practised are simply a faster route to the same
                place, and they still work when nobody hands you a picture. Next comes
                the machinery for curves that will not give their solutions up so easily,
                where factorising and the quadratic formula do the hunting for you.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
