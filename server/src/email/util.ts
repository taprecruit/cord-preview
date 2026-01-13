import { encode } from 'html-entities';
import type { MessageNode, MessageTextNode } from '@cord-sdk/types';
import { MessageNodeType } from '@cord-sdk/types';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';

function textNodeToHtml(node: MessageTextNode): string {
  let before = '';
  let after = '';
  if (node.bold) {
    before += '<strong>';
    after += '</strong>';
  }
  if (node.italic) {
    before = '<em>' + before;
    after += '</em>';
  }
  if (node.underline) {
    before = '<u>' + before;
    after += '</u>';
  }
  return before + encode(node.text) + after;
}

function convertNodeToHtml(node: MessageNode): string {
  if (node.type === undefined) {
    return textNodeToHtml(node);
  } else {
    switch (node.type) {
      case MessageNodeType.LINK:
        return `<a href="${encodeURI(node.url)}">${encode(
          (node.children[0] as MessageTextNode).text,
        )}</a>`;
      case MessageNodeType.PARAGRAPH:
        return `<p>${convertNodeListToEmailHtml(node.children)}</p>`;

      case MessageNodeType.TODO:
      case MessageNodeType.BULLET:
      case MessageNodeType.NUMBER_BULLET:
        return `<li>${convertNodeListToEmailHtml(node.children)}</li>`;
      case MessageNodeType.ASSIGNEE:
      case MessageNodeType.MENTION:
        return `<strong>${encode(
          (node.children[0] as MessageTextNode).text,
        )}</strong>`;
      case MessageNodeType.QUOTE:
        return `<blockquote style="border-left: 1px solid ${
          Colors.GREY_LIGHT
        };padding-left: ${Sizes.MEDIUM}px;">${convertNodeListToEmailHtml(
          node.children,
        )}</blockquote>`;

      case MessageNodeType.CODE:
        return `<code>${convertNodeListToEmailHtml(node.children)}</code>`;
      case MessageNodeType.MARKDOWN:
        // TODO: MARKDOWN_NODE strip markdown to plaintext
        return convertNodeListToEmailHtml(node.children);
    }
  }
}

// for email HTML we need to set a container around lists so it renders properly.
// https://perishablepress.com/css-center-align-list-left-align-text/
export function convertNodeListToEmailHtml(nodes: MessageNode[]) {
  let html = '';
  let unorderedListStarted = false;
  let orderedListStarted = false;

  // convert all nodes to html, but wrap consecutive sequences of <li> items
  // with <ol></ol> or <ul></ul>
  for (const node of nodes) {
    const nodeHtml = convertNodeToHtml(node);

    const isOrderedItem = node.type === MessageNodeType.NUMBER_BULLET;
    const isUnorderedItem =
      node.type === MessageNodeType.BULLET ||
      node.type === MessageNodeType.TODO;

    // end of ordered list
    if (!isOrderedItem && orderedListStarted) {
      orderedListStarted = false;
      html += '</ol></div>';
    }
    // end of unorderedList
    if (!isUnorderedItem && unorderedListStarted) {
      unorderedListStarted = false;
      html += '</ul></div>';
    }

    // start of ordered list
    if (isOrderedItem && !orderedListStarted) {
      orderedListStarted = true;
      html += '<div><ol>';
    }
    // start of unorderedList
    if (isUnorderedItem && !unorderedListStarted) {
      unorderedListStarted = true;
      html += '<div><ul>';
    }

    html += nodeHtml;
  }

  if (unorderedListStarted) {
    html += '</ul></div>';
  }

  if (orderedListStarted) {
    html += '</ol></div>';
  }

  return html;
}
