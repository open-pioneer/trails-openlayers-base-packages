// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Editable,
    EditableInput,
    EditablePreview,
    Flex,
    Spacer,
    List,
    Alert,
    AlertIcon,
    Text,
    Button,
    VStack,
    Input,
    ListProps
} from "@open-pioneer/chakra-integration";
import { PackageIntl } from "@open-pioneer/runtime";
import { useMapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { AddIcon } from "@chakra-ui/icons";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PiMapTrifold, PiTrashSimpleLight, PiCheck, PiXLight, PiFloppyDisk } from "react-icons/pi";
import { FC, useEffect, useState } from "react";
import { Extent } from "ol/extent";
const INIT_BOOKMARKS = [
    { title: "Düsseldorf", view: {} },
    { title: "Langenfeld", view: {} },
    { title: "Köln", view: {} }
];
type UIMode = "list" | "create" | "delete";
interface SpatialBookmarkProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    "aria-labelledby"?: string;
}
export const SpatialBookmark: FC<SpatialBookmarkProps> = (props) => {
    const { mapId, "aria-labelledby": ariaLabelledBy } = props;
    const intl = useIntl();
    const { map } = useMapModel(mapId);
    const [bookmarks, setBookmarks] = useState(INIT_BOOKMARKS);
    const [bookmarkName, setBookmarkName] = useState<string>("");
    const [currentExtent, setCurrentExtent] = useState<Extent | undefined>(undefined);
    const { containerProps } = useCommonComponentProps("spatial-bookmark", props);
    const [uiMode, setUiMode] = useState<UIMode>("list");

    const clearBookmarks = () => {
        setBookmarks([]);
        setUiMode("list");
    };
    const deleteBookmark = (index: number) => {
        setBookmarks(bookmarks.filter((_, idx) => idx !== index));
    };
    const addBookmark = () => {
        setBookmarks([...bookmarks, { title: bookmarkName, view: {} }]);
        setCurrentExtent(map?.olMap.getView().calculateExtent());
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
    const bookmarkList = createList(bookmarks, deleteBookmark, {
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
};
function createList(
    bookmarks: { title: string; view: {} }[],
    deleteBookmark: (imdex: number) => void,
    listProps: ListProps
) {
    const bookmarkItems = bookmarks.map((bookmark, idx) => (
        <BookmarkItem key={idx} title={bookmark.title} index={idx} onDelete={deleteBookmark} />
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
    title: string;
    index: number;
    onDelete: (index: number) => void;
}): JSX.Element {
    const { title, onDelete, index } = props;
    const zoomToBookmark = (title: string) => {
        console.log(`Zoom to ${title}`);
    };

    return (
        <Box
            as="li"
            padding={1}
            cursor={"pointer"}
            _hover={{ background: "lightgray" }}
            onClick={() => zoomToBookmark(title)}
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
                        onDelete(index);
                        event.stopPropagation();
                    }}
                />
            </Flex>
        </Box>
    );
}
function BookmarkHandler(props: {
    intl: PackageIntl;
    bookmarks: { title: string; view: {} }[];
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
