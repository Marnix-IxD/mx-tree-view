import { ReactElement, createElement } from "react";
import { TreeNode } from "../../types/TreeTypes";
import { ListAttributeValue } from "mendix";

interface TreeNodeContentProps {
    node: TreeNode;
    nodeContent: any;
    nodeLabelAttribute?: ListAttributeValue<string>;
    isHighlighted: boolean;
}

export function TreeNodeContent(props: TreeNodeContentProps): ReactElement {
    const { node, nodeContent, nodeLabelAttribute, isHighlighted } = props;

    // If custom content is provided, render it
    if (nodeContent) {
        return (
            <div className={`tree-node__custom-content ${isHighlighted ? "tree-node__custom-content--highlighted" : ""}`}>
                {nodeContent}
            </div>
        );
    }

    // Default rendering - get label from node
    const label = nodeLabelAttribute 
        ? nodeLabelAttribute.get(node.objectItem).value || "Untitled"
        : "Node " + node.id;

    return (
        <div className={`tree-node__default-content ${isHighlighted ? "tree-node__default-content--highlighted" : ""}`}>
            <span className="tree-node__label">{label}</span>
        </div>
    );
}