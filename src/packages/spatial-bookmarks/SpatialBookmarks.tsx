// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Button,
    ButtonProps,
    Center,
    Field,
    Flex,
    Icon,
    IconButton,
    IconButtonProps,
    Input,
    List,
    Spacer,
    Text,
    VStack
} from "@chakra-ui/react";
import { Alert } from "@open-pioneer/chakra-snippets/alert";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { LocalStorageService } from "@open-pioneer/local-storage";
import { MapModel, MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import { LuMap, LuTrash } from "react-icons/lu";
import { Bookmark, SpatialBookmarkViewModel } from "./SpatialBookmarksViewModel";

type UIMode = "list" | "create" | "delete";

export interface SpatialBookmarksProps extends CommonComponentProps, MapModelProps {}

/**
 * A component that allows the user to manage a set of spatial bookmarks.
 */
export const SpatialBookmarks: FC<SpatialBookmarksProps> = (props) => {
    const map = useMapModelValue(props);
    const localStorageService = useService<LocalStorageService>(
        "local-storage.LocalStorageService"
    );
    const viewModel = useViewModel(map, localStorageService);
    return viewModel && <SpatialBookmarkUI {...props} viewModel={viewModel} />;
};

function SpatialBookmarkUI(props: SpatialBookmarksProps & { viewModel: SpatialBookmarkViewModel }) {
    const { viewModel } = props;
    const intl = useIntl();
    const listItemNodes = useRef<HTMLElement[]>([]);
    const [scrollToLastItem, setScrollToLastItem] = useState(false);
    const bookmarks = useReactiveSnapshot(() => viewModel.bookmarks, [viewModel]);
    const [bookmarkName, setBookmarkName] = useState<string>("");
    const isValidBookmarkName = bookmarkName.trim().length > 0; // use trim to avoid bookmarks with space character only
    const { containerProps } = useCommonComponentProps("spatial-bookmarks", props);
    const [uiMode, setUiMode] = useState<UIMode>("list");

    const clearBookmarks = () => {
        viewModel.deleteAllBookmarks();
        setUiMode("list");
    };

    const addBookmark = () => {
        if (isValidBookmarkName) {
            viewModel.createBookmark(bookmarkName);
            setUiMode("list");
            setBookmarkName("");
            setScrollToLastItem(true);
        }
    };

    // Scroll to newly created bookmark after render
    useEffect(() => {
        if (scrollToLastItem) {
            const listItems = listItemNodes.current;
            if (listItems) {
                const lastItem = listItems[bookmarks.length - 1];
                lastItem?.scrollIntoView?.();
            }
            setScrollToLastItem(false);
        }
    }, [bookmarks, scrollToLastItem]);

    const deleteContent = () => (
        <VStack>
            <Alert
                rounded="md"
                status="warning"
                title={intl.formatMessage({ id: "bookmark.alert.delete" })}
                role="alert"
            />
            <RemoveControls
                intl={intl}
                onClear={clearBookmarks}
                onCancel={() => setUiMode("list")}
            />
        </VStack>
    );

    const createContent = () => (
        <VStack>
            <Alert
                rounded="md"
                status="info"
                title={intl.formatMessage({ id: "bookmark.alert.create" })}
                role="alert"
            />
            <Field.Root invalid={!isValidBookmarkName} required>
                <Input
                    aria-label={intl.formatMessage({ id: "bookmark.input.label" })}
                    placeholder={intl.formatMessage({ id: "bookmark.input.placeholder" })}
                    value={bookmarkName}
                    onChange={(event) => {
                        setBookmarkName(event.target.value);
                    }}
                    onKeyDown={(e) => {
                        // add bookmark only, if valid bookmark name exists
                        if (e.key === "Enter") {
                            addBookmark();
                        }
                    }}
                    autoFocus // eslint-disable-line jsx-a11y/no-autofocus
                />
            </Field.Root>
            <CreateControls
                intl={intl}
                isInvalid={!isValidBookmarkName}
                onCancel={() => {
                    setBookmarkName("");
                    setUiMode("list");
                }}
                onSave={addBookmark}
            />
        </VStack>
    );

    const listContent = () => (
        <>
            {bookmarks.length ? (
                createList(bookmarks, viewModel, intl, listItemNodes)
            ) : (
                <Alert
                    rounded="md"
                    status="info"
                    title={intl.formatMessage({ id: "bookmark.alert.noSaved" })}
                    role="alert"
                />
            )}
            <ListControls
                intl={intl}
                bookmarks={bookmarks}
                showCreate={() => setUiMode("create")}
                showDelete={() => setUiMode("delete")}
            />
        </>
    );

    const content = (
        <>
            {uiMode === "list" && listContent()}
            {uiMode === "create" && createContent()}
            {uiMode === "delete" && deleteContent()}
        </>
    );

    return (
        <Flex flexDirection="column" {...containerProps}>
            {content}
        </Flex>
    );
}

function createList(
    bookmarks: Bookmark[],
    viewModel: SpatialBookmarkViewModel,
    intl: PackageIntl,
    listRef: React.RefObject<HTMLElement[]>
) {
    const bookmarkItems = bookmarks.map((bookmark, idx) => (
        <BookmarkItem
            key={bookmark.id}
            index={idx}
            listItemNodes={listRef}
            bookmark={bookmark}
            onActivate={() => viewModel.activateBookmark(bookmark)}
            onDelete={() => viewModel.deleteBookmark(bookmark.id)}
            intl={intl}
        />
    ));

    return (
        <List.Root
            as="ul"
            className="spatial-bookmark-list"
            role="listbox"
            aria-label={intl.formatMessage({
                id: "bookmark.list.label"
            })}
            flexShrink={1}
            flexGrow={1}
            p={1} // Some padding for children's box shadow
            gap={1}
            overflowY="auto"
            listStyleType="none"
        >
            {bookmarkItems}
        </List.Root>
    );
}

// key name -> index
const ARROW_INDEX_MAP: Record<string, number> = {
    ArrowDown: 1,
    ArrowUp: -1
};

function BookmarkItem(props: {
    index: number;
    listItemNodes: React.RefObject<HTMLElement[]>;
    bookmark: Bookmark;
    onActivate: () => void;
    onDelete: () => void;
    intl: PackageIntl;
}): ReactNode {
    const { index, listItemNodes, bookmark, onDelete, onActivate, intl } = props;
    const title = bookmark.title;
    const onKeyDown = (evt: KeyboardEvent) => {
        const key = evt.key;
        if (key === "Enter") {
            // Ignore enter from child components (buttons)
            if (evt.target === evt.currentTarget) {
                onActivate();
            }
            return;
        }

        if (ARROW_INDEX_MAP[key] != null) {
            const len = listItemNodes.current?.length;
            if (!len) {
                return;
            }

            let nextIndex = (index + ARROW_INDEX_MAP[key]) % len;
            if (nextIndex < 0) {
                nextIndex = len - 1;
            }
            listItemNodes.current[nextIndex]?.focus();
        }
    };

    return (
        <List.Item
            as="li"
            p={1}
            ref={(el: HTMLElement | null) => {
                if (!el) {
                    listItemNodes.current.splice(index, 1);
                    return;
                }
                listItemNodes.current[index] = el;
            }}
            className={classNames("spatial-bookmarks-item")}
            tabIndex={0}
            rounded="md"
            role="option"
            cursor="pointer"
            outline={0}
            _hover={{ background: "trails.50" }}
            focusVisibleRing="outside"
            onKeyDown={onKeyDown}
            onClick={onActivate}
            aria-label={intl.formatMessage({ id: "bookmark.ariaLabel" }, { title: title })}
        >
            <Flex width="100%" flexDirection="row" align="center" gap={1}>
                <Center>
                    <Icon>
                        <LuMap />
                    </Icon>
                </Center>
                <Text ps={2} maxLines={1}>
                    {title}
                </Text>
                <Spacer />
                <Tooltip
                    key={index}
                    showArrow
                    content={intl.formatMessage({
                        id: "bookmark.button.deleteOne.tooltip"
                    })}
                    positioning={{
                        placement: "right"
                    }}
                >
                    <IconButton
                        className="spatial-bookmarks-item-delete"
                        borderRadius="full"
                        padding={0}
                        colorPalette="red"
                        variant="plain"
                        onClick={(event) => {
                            onDelete();
                            event.stopPropagation();
                        }}
                        aria-label={intl.formatMessage(
                            { id: "bookmark.button.deleteOne.ariaLabel" },
                            { title: title }
                        )}
                    >
                        <Icon>
                            <LuTrash />
                        </Icon>
                    </IconButton>
                </Tooltip>
            </Flex>
        </List.Item>
    );
}

function ListControls(props: {
    intl: PackageIntl;
    bookmarks: Bookmark[];
    showCreate: () => void;
    showDelete: () => void;
}): ReactNode {
    const { intl, bookmarks, showCreate, showDelete } = props;

    return (
        <ButtonContainer>
            <DialogIconButton
                aria-label={intl.formatMessage({ id: "bookmark.button.deleteAll" })}
                disabled={bookmarks.length === 0}
                colorPalette="red"
                onClick={showDelete}
                variant="outline"
            >
                <Icon>
                    <LuTrash />
                </Icon>
            </DialogIconButton>
            <DialogButton onClick={showCreate}>
                {intl.formatMessage({ id: "bookmark.button.create" })}
            </DialogButton>
        </ButtonContainer>
    );
}

function RemoveControls(props: { intl: PackageIntl; onClear: () => void; onCancel: () => void }) {
    const { intl, onCancel, onClear } = props;
    return (
        <ButtonContainer>
            <DialogButton variant="outline" onClick={onCancel}>
                {intl.formatMessage({ id: "bookmark.button.cancelDelete" })}
            </DialogButton>
            <DialogButton onClick={onClear}>
                {intl.formatMessage({ id: "bookmark.button.confirmDelete" })}
            </DialogButton>
        </ButtonContainer>
    );
}

function CreateControls(props: {
    intl: PackageIntl;
    isInvalid: boolean;
    onCancel: () => void;
    onSave: () => void;
}) {
    const { intl, onCancel, onSave, isInvalid } = props;
    return (
        <ButtonContainer>
            <DialogButton variant="outline" onClick={() => onCancel()}>
                {intl.formatMessage({ id: "bookmark.button.cancel" })}
            </DialogButton>
            <DialogButton disabled={isInvalid} onClick={() => onSave()}>
                {intl.formatMessage({ id: "bookmark.button.save" })}
            </DialogButton>
        </ButtonContainer>
    );
}

function ButtonContainer(props: { children: ReactNode }) {
    return (
        <Flex width="100%" flexDirection="row" mt={2} gap={2} flexGrow={0} flexShrink={0}>
            {props.children}
        </Flex>
    );
}

function DialogButton(props?: ButtonProps): ReactNode {
    return <Button flex="1 1 auto" {...props} />;
}

function DialogIconButton(props: IconButtonProps): ReactNode {
    return <IconButton flex="0 0 auto" px={4} {...props} />;
}

function useViewModel(map: MapModel, localStorageService: LocalStorageService) {
    const [viewModel, setViewModel] = useState<SpatialBookmarkViewModel>();
    useEffect(() => {
        const viewModel = new SpatialBookmarkViewModel(map, localStorageService);
        setViewModel(viewModel);
        return () => viewModel?.destroy();
    }, [map, localStorageService]);

    return viewModel;
}
