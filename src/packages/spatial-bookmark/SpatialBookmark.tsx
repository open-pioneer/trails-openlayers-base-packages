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
import classNames from "classnames";
import { LocalStorageService } from "@open-pioneer/local-storage";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, ReactNode, useEffect, useState, useRef } from "react";
import { PiMapTrifold, PiTrashSimpleLight } from "react-icons/pi";
import { Bookmark, SpatialBookmarkViewModel } from "./SpatialBookmarkViewModel";

type UIMode = "list" | "create" | "delete";

export interface SpatialBookmarkProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;
}

export const SpatialBookmark: FC<SpatialBookmarkProps> = (props) => {
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

function SpatialBookmarkUI(props: SpatialBookmarkProps & { viewModel: SpatialBookmarkViewModel }) {
    const { viewModel } = props;
    const intl = useIntl();
    const listRef = useRef([]);

    const bookmarks = useAtomValue(viewModel.bookmarks);
    const [bookmarkName, setBookmarkName] = useState<string>("");
    const { containerProps } = useCommonComponentProps("spatial-bookmark", props);
    const [uiMode, setUiMode] = useState<UIMode>("list");

    const clearBookmarks = () => {
        viewModel.deleteAllBookmarks();
        setUiMode("list");
    };

    const addBookmark = () => {
        viewModel.createBookmark(bookmarkName);
        setUiMode("list");
        setBookmarkName("");
    };

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
                placeholder={intl.formatMessage({ id: "bookmark.input.placeholder" })}
                value={bookmarkName}
                isRequired
                isInvalid={bookmarkName.trim().length === 0} // use trim to avoid bookmarks with space character only
                onChange={(event) => {
                    setBookmarkName(event.target.value);
                }}
                //eslint-disable-next-line
                autoFocus
                onKeyDown={(e) => {
                    // add bookmark only, if valid bookmark name exists
                    if (e.key === "Enter" && bookmarkName.trim().length !== 0) {
                        addBookmark();
                    }
                }}
            />
            <CreateControls
                intl={intl}
                bookmarkName={bookmarkName}
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
                createList(bookmarks, viewModel, intl, listRef)
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

    return (
        <Box {...containerProps} padding={2} width={"100%"}>
            {content}
        </Box>
    );
}

function createList(
    bookmarks: Bookmark[],
    viewModel: SpatialBookmarkViewModel,
    intl: PackageIntl,
    listRef: React.MutableRefObject<never[]>
) {
    const deleteBtnLabel = intl.formatMessage({
        id: "bookmark.button.deleteOne"
    });

    const bookmarkItems = bookmarks.map((bookmark, idx) => (
        <BookmarkItem
            index={idx}
            listRef={listRef}
            key={idx}
            bookmark={bookmark}
            onActivate={() => viewModel.activateBookmark(bookmark)}
            onDelete={() => viewModel.deleteBookmark(bookmark.id)}
            deleteBtnLabel={deleteBtnLabel}
        />
    ));

    return (
        <List
            as="ul"
            className="spatial-bookmark-list"
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

function BookmarkItem(props: {
    index: number;
    listRef: React.MutableRefObject<HTMLDivElement[]>;
    bookmark: Bookmark;
    onActivate: () => void;
    onDelete: () => void;
    deleteBtnLabel: string;
}): JSX.Element {
    const { index, listRef, bookmark, onDelete, onActivate, deleteBtnLabel } = props;
    const title = bookmark.title;
    const onKeyPress = (key: string) => {
        if (!listRef.current.length) {
            return;
        }
        const len = listRef.current?.length;
        interface arrowIndex {
            ArrowDown: number;
            ArrowUp: number;
        }
        const arrowIndexMap: arrowIndex = {
            ArrowDown: 1,
            ArrowUp: -1
        };
        if (arrowIndexMap[key as keyof arrowIndex]) {
            const nextIndex = index + arrowIndexMap[key as keyof arrowIndex];
            listRef.current[nextIndex % len]?.focus();
        }
        if (key === "Enter") {
            onActivate();
        }
    };
    return (
        <Box
            tabIndex={0}
            ref={(el) => {
                if (!el) {
                    listRef.current.splice(index, 1);
                    return;
                }
                listRef.current[index] = el;
            }}
            as="li"
            className={classNames(
                "spatial-bookmark-item",
                `spatial-bookmark-item-${slug(bookmark.id)}`
            )}
            rounded="md"
            role="option"
            padding={1}
            cursor={"pointer"}
            _hover={{ background: "trails.50" }}
            onKeyDown={(evt) => {
                onKeyPress(evt.key);
            }}
            onClick={() => {
                onActivate();
            }}
        >
            <Flex width="100%" flexDirection="row" align="center" gap={1}>
                <PiMapTrifold />
                <Text ps={2} noOfLines={1}>
                    {title}
                </Text>
                <Spacer />
                <Button
                    className="spatial-bookmark-item-details"
                    aria-label={deleteBtnLabel}
                    borderRadius="full"
                    iconSpacing={0}
                    padding={0}
                    colorScheme="red"
                    variant="ghost"
                    leftIcon={<PiTrashSimpleLight />}
                    onKeyDown={(evt) => {
                        evt.stopPropagation();
                    }}
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
    bookmarkName: string;
    onCancel: () => void;
    onSave: () => void;
}) {
    const { intl, onCancel, onSave, bookmarkName } = props;
    return (
        <ButtonContainer>
            <DialogButton variant="outline" onClick={() => onCancel()}>
                {intl.formatMessage({ id: "bookmark.button.cancel" })}
            </DialogButton>
            <DialogButton isDisabled={bookmarkName.trim().length === 0} onClick={() => onSave()}>
                {intl.formatMessage({ id: "bookmark.button.save" })}
            </DialogButton>
        </ButtonContainer>
    );
}

function ButtonContainer(props: { children: ReactNode }) {
    return (
        <Flex width="100%" flexDirection="row" gap={1} my={2}>
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
function slug(id: string) {
    return id
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
