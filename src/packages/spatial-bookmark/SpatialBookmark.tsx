// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { AddIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Editable,
    EditableInput,
    EditablePreview,
    Flex,
    Input,
    List,
    ListProps,
    Spacer,
    Text,
    VStack
} from "@open-pioneer/chakra-integration";
import { LocalStorageService } from "@open-pioneer/local-storage";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";
import { PiCheck, PiFloppyDisk, PiMapTrifold, PiTrashSimpleLight, PiXLight } from "react-icons/pi";
import { Bookmark, SpatialBookmarkViewModel } from "./SpatialBookmarkViewModel";

type UIMode = "list" | "create" | "delete";

interface SpatialBookmarkProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    "aria-labelledby"?: string;
}

export const SpatialBookmark: FC<SpatialBookmarkProps> = (props) => {
    const { map } = useMapModel(props.mapId);

    return map && <SetupViewModel {...props} map={map} />;
};

function SetupViewModel(props: SpatialBookmarkProps & { map: MapModel }) {
    const localStorageService = useService("local-storage.LocalStorageService");
    const viewModel = useViewModel(props.map, localStorageService);
    return (
        viewModel && (
            // Makes the store accessible to useAtom() etc. in the UI
            <JotaiProvider store={viewModel.store}>
                <SpatialBookmarkUI {...props} viewModel={viewModel} />
            </JotaiProvider>
        )
    );
}

function SpatialBookmarkUI(props: SpatialBookmarkProps & { viewModel: SpatialBookmarkViewModel }) {
    const { viewModel, "aria-labelledby": ariaLabelledBy } = props;
    const intl = useIntl();

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
    const deleteContent = (
        <VStack>
            <Alert status="warning">
                <AlertIcon />
                {intl.formatMessage({ id: "deleteBookmarkInfo" })}
            </Alert>
            <BookmarkRemoverHandler
                intl={intl}
                onClear={clearBookmarks}
                onCancel={() => setUiMode("list")}
            />
        </VStack>
    );
    const createContent = (
        <VStack>
            <Alert status="info">
                <AlertIcon />
                {intl.formatMessage({ id: "createBookmarkInfo" })}
            </Alert>
            <Editable
                placeholder={intl.formatMessage({ id: "bookmarkNamePlaceholder" })}
                width="100%"
                startWithEditView
            >
                <EditablePreview />
                <Input
                    as={EditableInput}
                    value={bookmarkName}
                    isRequired
                    onChange={(event) => {
                        setBookmarkName(event.target.value);
                    }}
                />
            </Editable>
            <BookmarkCreatorHandler
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
    const bookmarkList = createList(bookmarks, viewModel, {
        "aria-labelledby": ariaLabelledBy
    });
    const listContent = (
        <>
            {bookmarks.length ? (
                bookmarkList
            ) : (
                <Alert status="info">
                    <AlertIcon />
                    {intl.formatMessage({ id: "noSavedBookmarkInfo" })}
                </Alert>
            )}
            <BookmarkHandler
                intl={intl}
                bookmarks={bookmarks}
                showCreate={() => setUiMode("create")}
                showDelete={() => setUiMode("delete")}
            />
        </>
    );
    const content = (
        <>
            {uiMode === "list" && listContent}
            {uiMode === "create" && createContent}
            {uiMode === "delete" && deleteContent}
        </>
    );

    return (
        <Box
            {...containerProps}
            backgroundColor="white"
            padding={2}
            width={"350px"}
            overflowY="auto"
            maxHeight="300"
        >
            {content}
        </Box>
    );
}

function createList(
    bookmarks: Bookmark[],
    viewModel: SpatialBookmarkViewModel,
    listProps: ListProps
) {
    const bookmarkItems = bookmarks.map((bookmark, idx) => (
        <BookmarkItem
            key={idx}
            bookmark={bookmark}
            onActivate={() => viewModel.activateBookmark(bookmark)}
            onDelete={() => viewModel.deleteBookmark(bookmark.id)}
        />
    ));

    return (
        <List
            as="ul"
            className="spatial-bookmark-list"
            listStyleType="none"
            spacing={1}
            {...listProps}
        >
            {bookmarkItems}
        </List>
    );
}

function BookmarkItem(props: {
    bookmark: Bookmark;
    onActivate: () => void;
    onDelete: () => void;
}): JSX.Element {
    const { bookmark, onDelete, onActivate } = props;
    const title = bookmark.title;
    return (
        <Box
            as="li"
            padding={1}
            cursor={"pointer"}
            _hover={{ background: "lightgray" }}
            onClick={() => {
                onActivate();
            }}
        >
            <Flex width="100%" flexDirection="row" align="center" gap={1}>
                <PiMapTrifold />
                <Text noOfLines={1}>{title}</Text>
                <Spacer />
                <Button
                    size="sm"
                    className="toc-layer-item-details-button"
                    aria-label={"buttonLabel"}
                    borderRadius="full"
                    iconSpacing={0}
                    padding={0}
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
function BookmarkHandler(props: {
    intl: PackageIntl;
    bookmarks: Bookmark[];
    showCreate: () => void;
    showDelete: () => void;
}): JSX.Element {
    const { intl, bookmarks, showCreate, showDelete } = props;

    return (
        <Flex width="100%" flexDirection="row" gap={1} my={2}>
            <Button
                isDisabled={bookmarks.length === 0}
                colorScheme="red"
                size="sm"
                variant="outline"
                iconSpacing={0}
                leftIcon={<PiTrashSimpleLight />}
                onClick={showDelete}
            ></Button>
            <Button
                width="100%"
                size="sm"
                variant="outline"
                leftIcon={<AddIcon />}
                onClick={showCreate}
            >
                {intl.formatMessage({ id: "createBookmarkLabel" })}
            </Button>
        </Flex>
    );
}

function BookmarkRemoverHandler(props: {
    intl: PackageIntl;
    onClear: () => void;
    onCancel: () => void;
}) {
    const { intl, onCancel, onClear } = props;
    return (
        <Flex width="100%" flexDirection="row" gap={1} my={1}>
            <Button
                width="100%"
                size="sm"
                variant="outline"
                iconSpacing={0}
                leftIcon={<PiXLight />}
                onClick={onCancel}
            >
                {intl.formatMessage({ id: "bookmarkRemoverHandlerNo" })}
            </Button>
            <Button
                width="100%"
                size="sm"
                variant="outline"
                leftIcon={<PiCheck />}
                onClick={onClear}
            >
                {intl.formatMessage({ id: "bookmarkRemoverHandlerYes" })}
            </Button>
        </Flex>
    );
}
function BookmarkCreatorHandler(props: {
    intl: PackageIntl;
    bookmarkName: string;
    onCancel: () => void;
    onSave: () => void;
}) {
    const { intl, onCancel, onSave, bookmarkName } = props;
    return (
        <Flex width="100%" flexDirection="row" gap={1} my={1}>
            <Button
                width="100%"
                size="sm"
                variant="outline"
                iconSpacing={0}
                leftIcon={<PiXLight />}
                onClick={() => onCancel()}
            >
                {intl.formatMessage({ id: "bookmarkCreatorHandlerCancel" })}
            </Button>
            <Button
                isDisabled={bookmarkName.length === 0}
                width="100%"
                size="sm"
                variant="outline"
                leftIcon={<PiFloppyDisk />}
                onClick={() => onSave()}
            >
                {intl.formatMessage({ id: "bookmarkCreatorHandlerSave" })}
            </Button>
        </Flex>
    );
}

function useViewModel(map: MapModel, localStorageService: LocalStorageService) {
    const [viewModel, setViewModel] = useState<SpatialBookmarkViewModel>();
    useEffect(() => {
        const viewModel = new SpatialBookmarkViewModel(map, localStorageService);
        setViewModel(viewModel);
        return () => viewModel.destroy();
    }, [map, localStorageService]);

    return viewModel;
}
