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
    Input
} from "@open-pioneer/chakra-integration";
import { PackageIntl } from "@open-pioneer/runtime";
import { useMapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { AddIcon } from "@chakra-ui/icons";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import {
    PiMapTrifold,
    PiTrashSimpleLight,
    PiPencilSimple,
    PiCheck,
    PiXLight,
    PiFloppyDisk
} from "react-icons/pi";
import { FC, useEffect, useState, useId, useRef, MouseEvent } from "react";
const INIT_BOOKMARKS = [
    { title: "Düsseldorf", view: {} },
    { title: "Langenfeld", view: {} },
    { title: "Köln", view: {} }
];
type UIMode = "list" | "create" | "edit" | "delete";
interface SpatialBookmarkProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;
}
export const SpatialBookmark: FC<SpatialBookmarkProps> = (props) => {
    const { mapId } = props;
    const intl = useIntl();
    //TODO: //aria - labelledby;
    const [bookmarks, setBookmarks] = useState(INIT_BOOKMARKS);
    const [bookmarkName, setBookmarkName] = useState<string>("");
    const { containerProps } = useCommonComponentProps("spatial-bookmark", props);
    const [uiMode, setUiMode] = useState<UIMode>("list");
    const createBookmark = () => {
        setUiMode("create");
    };
    const deleteAllBookmarks = () => {
        setUiMode("delete");
    };
    const editBookmark = (index: number) => {
        const found = bookmarks.find((_, idx) => idx === index);
        if (!found) {
            return;
        }
        setBookmarkName(found.title);
        setUiMode("edit");
        console.log(found.title);
    };

    const deleteBookmark = (index: number) => {
        setBookmarks(bookmarks.filter((_, idx) => idx !== index));
    };
    const restoreUiMode = () => {
        setUiMode("list");
    };
    const addBookmark = () => {
        setBookmarks([...bookmarks, { title: bookmarkName, view: {} }]);
        setUiMode("list");
    };
    const bookmarkList = createList(bookmarks, editBookmark, deleteBookmark);
    const deleteContent = (
        <VStack>
            <Alert status="warning">
                <AlertIcon />
                {intl.formatMessage({ id: "deleteBookmarkInfo" })}
            </Alert>
            <BookmarkRemoverHandler intl={intl} restoreUiMode={restoreUiMode} />
        </VStack>
    );
    const createContent = (
        <VStack>
            <Alert status="info">
                <AlertIcon />
                {intl.formatMessage({ id: "createBookmarkInfo" })}
            </Alert>
            <Editable placeholder="Name des Lesezeichens" width="100%" startWithEditView>
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
                restoreUiMode={restoreUiMode}
                addBookmark={addBookmark}
            />
        </VStack>
    );

    const editContent = (
        <VStack>
            <Alert status="info">
                <AlertIcon />
                {intl.formatMessage({ id: "editBookmarkInfo" })}
            </Alert>
            <Editable width="100%" startWithEditView defaultValue={bookmarkName}>
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
                restoreUiMode={restoreUiMode}
                addBookmark={addBookmark}
            />
        </VStack>
    );
    const listContent = (
        <>
            {bookmarkList}
            <BookmarkHandler
                intl={intl}
                createBookmark={createBookmark}
                deleteAllBookmarks={deleteAllBookmarks}
            />
        </>
    );
    const content = (
        <>
            {uiMode === "list" && listContent}
            {uiMode === "create" && createContent}
            {uiMode === "edit" && editContent}
            {uiMode === "delete" && deleteContent}
        </>
    );

    return (
        <Box {...containerProps} backgroundColor="white" padding={2} width={"350px"}>
            {content}
        </Box>
    );
};
function createList(
    bookmarks: { title: string; view: {} }[],
    editBookmark: (index: number) => void,
    deleteBookmark: (imdex: number) => void
) {
    const bookmarkItems = bookmarks.map((bookmark, idx) => (
        <BookmarkItem
            key={idx}
            title={bookmark.title}
            index={idx}
            editBookmark={editBookmark}
            deleteBookmark={deleteBookmark}
        />
    ));

    return (
        <List as="ul" className="spatial-bookmark-list" listStyleType="none" spacing={3}>
            {bookmarkItems}
        </List>
    );
}
function BookmarkItem(props: {
    title: string;
    index: number;
    editBookmark: (index: number) => void;
    deleteBookmark: (index: number) => void;
}): JSX.Element {
    const { title, editBookmark, deleteBookmark, index } = props;
    const zoomToBookmark = (title: string) => {
        console.log(`Zoom to ${title}`);
    };

    return (
        <Box
            as="li"
            paddingLeft={1}
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
                    leftIcon={<PiPencilSimple />}
                    onClick={(event) => {
                        editBookmark(index);
                        event.stopPropagation();
                    }}
                />
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
                        deleteBookmark(index);
                        event.stopPropagation();
                    }}
                />
            </Flex>
        </Box>
    );
}
function BookmarkHandler(props: {
    intl: PackageIntl;
    createBookmark: () => void;
    deleteAllBookmarks: () => void;
}): JSX.Element {
    const { intl, createBookmark, deleteAllBookmarks } = props;

    return (
        <Flex width="100%" flexDirection="row" gap={1} my={2}>
            <Button
                colorScheme="red"
                size="sm"
                variant="outline"
                iconSpacing={0}
                leftIcon={<PiTrashSimpleLight />}
                onClick={() => deleteAllBookmarks()}
            ></Button>
            <Button
                width="100%"
                size="sm"
                variant="outline"
                leftIcon={<AddIcon />}
                onClick={() => createBookmark()}
            >
                {intl.formatMessage({ id: "createBookmarkLabel" })}
            </Button>
        </Flex>
    );
}
function BookmarkRemoverHandler(props: { intl: PackageIntl; restoreUiMode: () => void }) {
    const { intl, restoreUiMode } = props;
    return (
        <Flex width="100%" flexDirection="row" gap={1} my={1}>
            <Button
                width="100%"
                size="sm"
                variant="outline"
                iconSpacing={0}
                leftIcon={<PiXLight />}
                onClick={() => restoreUiMode()}
            >
                {intl.formatMessage({ id: "bookmarkRemoverHandlerNo" })}
            </Button>
            <Button
                width="100%"
                size="sm"
                variant="outline"
                leftIcon={<PiCheck />}
                onClick={() => restoreUiMode()}
            >
                {intl.formatMessage({ id: "bookmarkRemoverHandlerYes" })}
            </Button>
        </Flex>
    );
}
function BookmarkCreatorHandler(props: {
    intl: PackageIntl;
    restoreUiMode: () => void;
    addBookmark: () => void;
}) {
    const { intl, restoreUiMode, addBookmark } = props;
    return (
        <Flex width="100%" flexDirection="row" gap={1} my={1}>
            <Button
                width="100%"
                size="sm"
                variant="outline"
                iconSpacing={0}
                leftIcon={<PiXLight />}
                onClick={() => restoreUiMode()}
            >
                {intl.formatMessage({ id: "bookmarkCreatorHandlerCancel" })}
            </Button>
            <Button
                width="100%"
                size="sm"
                variant="outline"
                leftIcon={<PiFloppyDisk />}
                onClick={() => addBookmark()}
            >
                {intl.formatMessage({ id: "bookmarkCreatorHandlerSave" })}
            </Button>
        </Flex>
    );
}
