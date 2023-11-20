// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Flex,
    List,
    ListItem,
    ListIcon,
    Text,
    Button
} from "@open-pioneer/chakra-integration";
import { PackageIntl } from "@open-pioneer/runtime";
import { useMapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { AddIcon } from "@chakra-ui/icons";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PiMapTrifold, PiTrashSimpleLight } from "react-icons/pi";
import { FC, useEffect, useState } from "react";
const INIT_BOOKMARKS = [
    { title: "Düsseldorf", view: {} },
    { title: "Langenfeld", view: {} },
    { title: "Köln", view: {} }
];
interface SpatialBookmarkProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;
}
export const SpatialBookmark: FC<SpatialBookmarkProps> = (props) => {
    const { mapId } = props;
    const intl = useIntl();
    const [bookmarks, setBookmarks] = useState(INIT_BOOKMARKS);
    const { containerProps } = useCommonComponentProps("spatial-bookmark", props);
    const bookmarkList = createList(bookmarks);

    return (
        <Box {...containerProps} backgroundColor="white" padding={2} width={"350px"}>
            {bookmarkList}
            <BookmarkHandler intl={intl} />
        </Box>
    );
};
function createList(bookmarks: { title: string; view: {} }[]) {
    const bookmarkItems = bookmarks.map((bookmark, idx) => (
        <BookmarkItem key={idx} title={bookmark.title} />
    ));

    return (
        <List as="ul" className="spatial-bookmark-list" listStyleType="none" spacing={3}>
            {bookmarkItems}
        </List>
    );
}
function BookmarkItem(props: { title: string }): JSX.Element {
    const { title } = props;
    return (
        <ListItem>
            <Text noOfLines={1}>
                <ListIcon as={PiMapTrifold} />
                {title}
            </Text>
        </ListItem>
    );
}
function BookmarkHandler(props: { intl: PackageIntl }): JSX.Element {
    const { intl } = props;
    return (
        <Flex width="100%" flexDirection="row" gap={1} my={2}>
            <Button
                size="sm"
                variant="outline"
                iconSpacing={0}
                leftIcon={<PiTrashSimpleLight />}
            ></Button>
            <Button size="sm" variant="outline" leftIcon={<AddIcon />}>
                {intl.formatMessage({ id: "createBookmarkLabel" })}
            </Button>
        </Flex>
    );
}
