// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    ButtonProps,
    Flex,
    Input,
    List,
    Spacer,
    Text,
    VStack
} from "@open-pioneer/chakra-integration";
import { LocalStorageService } from "@open-pioneer/local-storage";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import { PiMapTrifold, PiTrashSimpleLight } from "react-icons/pi";
import { Bookmark, SpatialBookmarkViewModel } from "./SpatialBookmarksViewModel";

type UIMode = "list" | "create" | "delete";

export interface SpatialBookmarksProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;
}

/**
 * A component that allows the user to manage a set of spatial bookmarks.
 */
export const SpatialBookmarks: FC<SpatialBookmarksProps> = (props) => {
    const { map } = useMapModel(props.mapId);
    const localStorageService = useService("local-storage.LocalStorageService");
    const viewModel = useViewModel(map, localStorageService);
    return (
        viewModel && (
            // Makes the store accessible to useAtom() etc. in the UI
            <JotaiProvider store={viewModel.store}>
                <SpatialBookmarkUI {...props} viewModel={viewModel} />
            </JotaiProvider>
        )
    );
};

function SpatialBookmarkUI(props: SpatialBookmarksProps & { viewModel: SpatialBookmarkViewModel }) {
    const { viewModel } = props;
    const intl = useIntl();
    const listItemNodes = useRef<HTMLElement[]>([]);
    const [scrollToLastItem, setScrollToLastItem] = useState(false);

    const bookmarks = useAtomValue(viewModel.bookmarks);
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
            <Alert rounded="md" status="warning">
                <AlertIcon />
                {intl.formatMessage({ id: "bookmark.alert.delete" })}
            </Alert>
            <RemoveControls
                intl={intl}
                onClear={clearBookmarks}
                onCancel={() => setUiMode("list")}
            />
        </VStack>
    );

    const createContent = () => (
        <VStack>
            <Alert rounded="md" status="info">
                <AlertIcon />
                {intl.formatMessage({ id: "bookmark.alert.create" })}
            </Alert>
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
                isRequired
                isInvalid={!isValidBookmarkName}
                autoFocus // eslint-disable-line jsx-a11y/no-autofocus
            />
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
                <Alert rounded="md" status="info">
                    <AlertIcon />
                    {intl.formatMessage({ id: "bookmark.alert.noSaved" })}
                </Alert>
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

    return <Box {...containerProps}>{content}</Box>;
}

function createList(
    bookmarks: Bookmark[],
    viewModel: SpatialBookmarkViewModel,
    intl: PackageIntl,
    listRef: React.MutableRefObject<HTMLElement[]>
) {
    const deleteBtnLabel = intl.formatMessage({
        id: "bookmark.button.deleteOne"
    });

    const bookmarkItems = bookmarks.map((bookmark, idx) => (
        <BookmarkItem
            key={bookmark.id}
            index={idx}
            listItemNodes={listRef}
            bookmark={bookmark}
            onActivate={() => viewModel.activateBookmark(bookmark)}
            onDelete={() => viewModel.deleteBookmark(bookmark.id)}
            deleteBtnLabel={deleteBtnLabel}
        />
    ));

    return (
        <List
            as="ul"
            p={1} // Some padding for children's box shadow
            className="spatial-bookmark-lists"
            listStyleType="none"
            role="listbox"
            spacing={1}
            aria-label={intl.formatMessage({
                id: "bookmark.list.label"
            })}
            overflowY="auto"
            maxHeight="200"
        >
            {bookmarkItems}
        </List>
    );
}

// key name -> index
const ARROW_INDEX_MAP: Record<string, number> = {
    ArrowDown: 1,
    ArrowUp: -1
};

function BookmarkItem(props: {
    index: number;
    listItemNodes: React.MutableRefObject<HTMLElement[]>;
    bookmark: Bookmark;
    onActivate: () => void;
    onDelete: () => void;
    deleteBtnLabel: string;
}): JSX.Element {
    const { index, listItemNodes, bookmark, onDelete, onActivate, deleteBtnLabel } = props;
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

            let nextIndex = (index + ARROW_INDEX_MAP[key]!) % len;
            if (nextIndex < 0) {
                nextIndex = len - 1;
            }
            listItemNodes.current[nextIndex]?.focus();
        }
    };
    return (
        <Box
            as="li"
            p={1}
            ref={(el: HTMLDivElement | null) => {
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
            _focusVisible={{ boxShadow: "outline" }}
            onKeyDown={onKeyDown}
            onClick={onActivate}
        >
            <Flex width="100%" flexDirection="row" align="center" gap={1}>
                <PiMapTrifold />
                <Text ps={2} noOfLines={1}>
                    {title}
                </Text>
                <Spacer />
                <Button
                    className="spatial-bookmarks-item-delete"
                    aria-label={deleteBtnLabel}
                    borderRadius="full"
                    iconSpacing={0}
                    padding={0}
                    colorScheme="red"
                    variant="ghost"
                    leftIcon={<PiTrashSimpleLight />}
                    onClick={(event) => {
                        onDelete();
                        event.stopPropagation();
                    }}
                />
            </Flex>
        </Box>
    );
}

function ListControls(props: {
    intl: PackageIntl;
    bookmarks: Bookmark[];
    showCreate: () => void;
    showDelete: () => void;
}): JSX.Element {
    const { intl, bookmarks, showCreate, showDelete } = props;

    return (
        <ButtonContainer>
            <DialogButton
                isDisabled={bookmarks.length === 0}
                colorScheme="red"
                width={undefined}
                iconSpacing={0}
                leftIcon={<PiTrashSimpleLight />}
                onClick={showDelete}
                aria-label={intl.formatMessage({ id: "bookmark.button.deleteAll" })}
                variant="outline"
            />
            <DialogButton onClick={showCreate} width="100%">
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
            <DialogButton isDisabled={isInvalid} onClick={() => onSave()}>
                {intl.formatMessage({ id: "bookmark.button.save" })}
            </DialogButton>
        </ButtonContainer>
    );
}

function ButtonContainer(props: { children: ReactNode }) {
    return (
        <Flex width="100%" flexDirection="row" mt={2} gap={1}>
            {props.children}
        </Flex>
    );
}

function DialogButton(props?: ButtonProps): JSX.Element {
    return <Button width="100%" {...props} />;
}

function useViewModel(map: MapModel | undefined, localStorageService: LocalStorageService) {
    const [viewModel, setViewModel] = useState<SpatialBookmarkViewModel>();
    useEffect(() => {
        let viewModel: SpatialBookmarkViewModel | undefined;
        if (!map) {
            viewModel = undefined;
        } else {
            viewModel = new SpatialBookmarkViewModel(map, localStorageService);
        }

        setViewModel(viewModel);
        return () => viewModel?.destroy();
    }, [map, localStorageService]);

    return viewModel;
}
