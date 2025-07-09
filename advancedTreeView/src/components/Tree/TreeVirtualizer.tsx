import { ReactElement, createElement } from "react";
import { TreeNode } from "../../types/TreeTypes";

interface TreeVirtualizerProps {
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    virtualizer: {
        getVirtualItems: () => Array<{
            key: string | number;
            index: number;
            start: number;
            size: number;
        }>;
        getTotalSize: () => number;
    };
    visibleFlatNodes: TreeNode[];
    renderNode: (node: TreeNode, index: number) => ReactElement;
}

export function TreeVirtualizer(props: TreeVirtualizerProps): ReactElement {
    const { scrollContainerRef, virtualizer, visibleFlatNodes, renderNode } = props;
    const virtualItems = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();

    return (
        <div className="tree-view-container" ref={scrollContainerRef}>
            <div 
                className="tree-view-virtual-container"
                style={{ height: `${totalSize}px` }}
            >
                {virtualItems.map(virtualItem => {
                    const node = visibleFlatNodes[virtualItem.index];
                    if (!node) return null;

                    return (
                        <div
                            key={virtualItem.key}
                            className="tree-view-virtual-item"
                            style={{
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`
                            }}
                        >
                            {renderNode(node, virtualItem.index)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}