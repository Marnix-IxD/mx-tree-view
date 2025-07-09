import { ReactElement, createElement } from "react";
import { HelloWorldSample } from "./components/HelloWorldSample";
import { AdvancedTreeViewPreviewProps } from "../typings/AdvancedTreeViewProps";

export function preview({ sampleText }: AdvancedTreeViewPreviewProps): ReactElement {
    return <HelloWorldSample sampleText={sampleText} />;
}

export function getPreviewCss(): string {
    return require("./ui/AdvancedTreeView.css");
}
