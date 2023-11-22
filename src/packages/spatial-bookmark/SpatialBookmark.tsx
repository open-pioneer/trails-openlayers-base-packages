// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { AddIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    ButtonProps,
    Editable,
    EditableInput,
    EditablePreview,
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
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, ReactNode, useEffect, useState } from "react";
import { PiCheck, PiFloppyDisk, PiMapTrifold, PiTrashSimpleLight, PiXLight } from "react-icons/pi";
import { Bookmark, SpatialBookmarkViewModel } from "./SpatialBookmarkViewModel";

/*
    TODO: 
    - listbox interaction (uparrow / downarrow / focus)
    - overflow list
    - enter -> create bookmark
*/

type UIMode = "list" | "create" | "delete";

interface SpatialBookmarkProps extends CommonComponentProps {
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
            <Alert status="warning">
                <AlertIcon />
                {intl.formatMessage({ id: "deleteBookmarkInfo" })}
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
                createList(
                    bookmarks,
                    viewModel,
                    intl.formatMessage({
                        id: "listLabel"
                    })
                )
            ) : (
                <Alert status="info">
                    <AlertIcon />
                    {intl.formatMessage({ id: "noSavedBookmarkInfo" })}
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
        <Box {...containerProps} padding={2} width={"350px"} overflowY="auto" maxHeight="300">
            {content}
        </Box>
    );
}

function createList(bookmarks: Bookmark[], viewModel: SpatialBookmarkViewModel, listLabel: string) {
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
            role="listbox"
            spacing={1}
            aria-label={listLabel}
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
            role="option"
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
                    aria-label={"buttonLabel"} // TODO
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
                aria-label="TODO" // TODO
            />
            <DialogButton leftIcon={<AddIcon />} onClick={showCreate}>
                {intl.formatMessage({ id: "createBookmarkLabel" })}
            </DialogButton>
        </ButtonContainer>
    );
}

function RemoveControls(props: { intl: PackageIntl; onClear: () => void; onCancel: () => void }) {
    const { intl, onCancel, onClear } = props;
    return (
        <ButtonContainer>
            <DialogButton leftIcon={<PiXLight />} onClick={onCancel}>
                {intl.formatMessage({ id: "bookmarkRemoverHandlerNo" })}
            </DialogButton>
            <DialogButton leftIcon={<PiCheck />} onClick={onClear}>
                {intl.formatMessage({ id: "bookmarkRemoverHandlerYes" })}
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
            <DialogButton leftIcon={<PiXLight />} onClick={() => onCancel()}>
                {intl.formatMessage({ id: "bookmarkCreatorHandlerCancel" })}
            </DialogButton>
            <DialogButton
                isDisabled={bookmarkName.length === 0}
                leftIcon={<PiFloppyDisk />}
                onClick={() => onSave()}
            >
                {intl.formatMessage({ id: "bookmarkCreatorHandlerSave" })}
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
    return <Button width="100%" size="sm" variant="outline" {...props} />;
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
