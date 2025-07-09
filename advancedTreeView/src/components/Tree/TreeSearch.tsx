import { ReactElement, createElement, useCallback, useRef } from "react";
import { DynamicValue, WebIcon } from "mendix";
import { Icon } from "../../icons/Icon";
import "./TreeSearch.scss";

interface TreeSearchProps {
    value: string;
    onChange: (value: string) => void;
    isSearching: boolean;
    resultCount: number;
    placeholder?: string;
    searchIcon?: DynamicValue<WebIcon>;
}

export function TreeSearch(props: TreeSearchProps): ReactElement {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        props.onChange(e.target.value);
    }, [props.onChange]);

    const handleClear = useCallback(() => {
        props.onChange("");
        inputRef.current?.focus();
    }, [props.onChange]);

    return (
        <div className="tree-search">
            <div className="tree-search-input-wrapper">
                <Icon
                    icon={props.searchIcon}
                    fallback="search"
                    className="tree-search-icon"
                />
                <input
                    ref={inputRef}
                    type="text"
                    className="tree-search-input"
                    value={props.value}
                    onChange={handleChange}
                    placeholder={props.placeholder}
                    aria-label="Search tree"
                />
                {props.value && (
                    <button
                        className="tree-search-clear"
                        onClick={handleClear}
                        aria-label="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>
            {props.value && (
                <div className="tree-search-status">
                    {props.isSearching ? (
                        <span>Searching...</span>
                    ) : (
                        <span>{props.resultCount} results found</span>
                    )}
                </div>
            )}
        </div>
    );
}