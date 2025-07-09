import { ReactElement, createElement } from "react";
import { TreeNode } from "../../types/TreeTypes";
import { ListAttributeValue } from "mendix";
import "./TreeBreadcrumb.css";

interface TreeBreadcrumbProps {
    path: TreeNode[];
    onClick: (node: TreeNode) => void;
    nodeLabelAttribute: ListAttributeValue<string>;
}

export function TreeBreadcrumb(props: TreeBreadcrumbProps): ReactElement {
    const { path, onClick, nodeLabelAttribute } = props;

    if (path.length === 0) {
        return <div className="tree-breadcrumb" />;
    }

    return (
        <div className="tree-breadcrumb">
            {path.map((node, index) => {
                const isLast = index === path.length - 1;
                const label = nodeLabelAttribute.get(node.objectItem).value || "Untitled";

                return (
                    <span key={node.id}>
                        <button
                            className={`tree-breadcrumb-item ${isLast ? "tree-breadcrumb-item--current" : ""}`}
                            onClick={() => !isLast && onClick(node)}
                            disabled={isLast}
                            aria-current={isLast ? "page" : undefined}
                        >
                            {label}
                        </button>
                        {!isLast && (
                            <span className="tree-breadcrumb-separator" aria-hidden="true">
                                /
                            </span>
                        )}
                    </span>
                );
            })}
        </div>
    );
}