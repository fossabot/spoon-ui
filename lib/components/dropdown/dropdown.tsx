import './dropdown.scss';
import React, { ChangeEvent } from 'react';
import cx from 'classnames';
import { DropdownItem, IDropdownItem } from './dropdown-item';
import { TranslatedValueOrKey, translateItem } from '../../util/translation';
import { WithPopover } from '../with-popover/with-popover';
import { Button } from '../button/button';
import { ScrollableArea } from '../scrollable-area/scrollable-area';
import Search from '@material-ui/icons/Search';
import { DropdownToggleProps } from 'reactstrap/lib/DropdownToggle';

export interface IDropdownProps<T> extends Omit<DropdownToggleProps, 'placeholder'> {
  multiple?: boolean;
  search?: boolean;
  searchFunction?: (state: IDropdownState<T>, search: string) => Promise<Array<IDropdownItem<T>>>;
  selectionBar?: boolean;
  initialValues?: Array<IDropdownItem<T>>;
  initialSelection?: Array<IDropdownItem<T>>;
  iconLeft?: boolean;
  iconRight?: boolean;
  selectAll?: boolean;
  placeholder?: TranslatedValueOrKey<T>;
  tags?: boolean;
  onValueSelected?: (v: IDropdownItem<T>, sender: DropdownItem<T>) => void;
  onValueDeselected?: (v: IDropdownItem<T>, sender: DropdownItem<T>) => void;
  onSelectionChanged?: (selection: Array<IDropdownItem<T>>) => void;
  disabled: boolean;
  alignRight: boolean;
  disableDeselect: boolean;
  unselectable: 'on' | 'off';
  onOpen?: () => void;
  onClose?: () => void;
}

export interface IDropdownState<T> {
  selection: Array<IDropdownItem<T>>;
  searching: boolean;
  values: Array<IDropdownItem<T>>;
  search?: string;
}

export class Dropdown<T> extends React.Component<IDropdownProps<T>, IDropdownState<T>> {
  static defaultProps = {
    alignRight: false,
    multiple: false,
    search: false,
    searchFunction: (state: IDropdownState<any>, search: string) =>
      Promise.resolve(
        state.values
          .map(m => '' + m)
          .filter(m => m.startsWith(search))
          .map(m => ({ display: m, value: m }))
      ),
    selectAll: false,
    tags: false,
    onValueSelected: (v, i) => {},
    onValueDeselected: (v, i) => {},
    disabled: false,
    direction: 'down',
    disableDeselect: false,
    unselectable: 'on'
  };

  state: IDropdownState<T> = {
    selection: [],
    searching: false,
    values: []
  };

  componentDidMount() {
    if (this.props.initialValues) {
      this.updateSelection();
    }
  }

  componentDidUpdate(oldProps: IDropdownProps<T>, oldState: IDropdownState<T>) {
    if (oldProps.initialValues !== this.props.initialValues) {
      this.updateSelection();
    }
  }

  public get selection(): Array<IDropdownItem<T>> {
    return this.state.selection;
  }

  private updateSelection = () => {
    this.setState(_ => ({
      values: this.props.initialValues,
      selection: [...this.props.initialValues.filter(b => b.selected)]
    }));
  };

  render() {
    const {
      className,
      multiple,
      search,
      selectionBar,
      initialValues,
      iconLeft,
      iconRight,
      selectAll,
      placeholder,
      tags,
      onValueSelected,
      onValueDeselected,
      onSelectionChanged,
      disabled,
      alignRight,
      disableDeselect,
      unselectable,
      onOpen,
      onClose,
      ...other
    } = this.props;

    const valSelected = (val: IDropdownItem<T>, sender: DropdownItem<T>) => {
      if (!multiple) {
        this.state.values.filter(i => i !== val).forEach(i => (i.selected = false));

        if (!!onSelectionChanged) {
          onSelectionChanged([val]);
        }
        this.setState(_ => ({ selection: [val] }));
      } else {
        this.setState(prevState => {
          const vals = prevState.selection;
          if (!vals.includes(val)) {
            vals.push(val);
          }

          if (!!onSelectionChanged) {
            onSelectionChanged(vals);
          }

          return { selection: vals };
        });
      }
      onValueSelected(val, sender);
    };

    const valDeselected = (val: IDropdownItem<T>, sender: DropdownItem<T>) => {
      if (!multiple && !disableDeselect) {
        this.setState(_ => ({ selection: [] }));
        onValueDeselected(val, sender);

        if (!!onSelectionChanged) {
          onSelectionChanged([]);
        }
      } else if (multiple) {
        this.setState(prevState => {
          const vals = prevState.selection;
          if (vals.includes(val)) {
            vals.splice(vals.indexOf(val), 1);
          }

          if (!!onSelectionChanged) {
            onSelectionChanged(vals);
          }

          return { selection: vals };
        });
        onValueDeselected(val, sender);
      }
    };

    const showIcon = !multiple && this.state.selection.length === 1;
    const mustShowPlaceholder = this.state.selection.length === 0;

    const dropdownClass = cx('dropdown-button', className, { placeholder: mustShowPlaceholder });

    const items =
      !this.state.searching && !!this.state.values
        ? this.state.values
            .filter(
              b =>
                !this.state.search ||
                ('' + b.value).toLowerCase().indexOf(this.state.search.toLowerCase()) >= 0 ||
                translateItem(b)
                  .toLowerCase()
                  .indexOf(this.state.search.toLowerCase()) >= 0
            )
            .map(sv => (
              <DropdownItem
                {...this.props}
                selectable
                value={sv}
                key={sv.name || (sv.value && sv.value.toString())}
                onSelected={valSelected}
                onDeselected={valDeselected}
                tag={tags}
              />
            ))
        : [];

    const displayText = mustShowPlaceholder
      ? translateItem(placeholder)
      : translateItem(
          this.state.selection
            .reduce((acc, s) => {
              acc.push(s.display);
              return acc;
            }, [])
            .join(', ')
        );

    const onSearchChanged = (val: ChangeEvent<HTMLInputElement>) => {
      if (val.target) {
        const value = val.target.value;
        this.setState(_ => ({ search: value }));
      }
    };

    const searchBarComp = search ? (
      <div className="search-container">
        <div className="search-input-container">
          <Search className="search-icon" />
          <input type="text" className="search-input" placeholder="Search" onChange={onSearchChanged} />
        </div>
      </div>
    ) : null;

    const selectionBarComp = selectionBar && (
      <div className="tags-container selected-tags selection-container">
        {this.state.selection.map(v => (
          <DropdownItem
            selectable
            tag
            value={v}
            key={v.name || (v.value && v.value.toString())}
            onSelected={valSelected}
            onDeselected={valDeselected}
            checkNotCross={false}
          />
        ))}
      </div>
    );
    const menuClassName = cx('dropdown', {
      multiple,
      tags,
      'align-right': alignRight
    });

    const searchingOrItems = this.state.searching ? [<i key="searching">Searching</i>] : items;
    return (
      <WithPopover
        className={menuClassName}
        autoOpen
        autoClose
        closeOnMainClick
        mainComponent={
          <Button block className={dropdownClass} disabled={this.props.disabled}>
            {showIcon && <span className="dropdown-selection-icon">{this.state.selection[0].icon}</span>}
            <span className="button-text">{showIcon ? <span className="icon-with-text">{displayText}</span> : displayText}</span>
          </Button>
        }
      >
        <div className="dropdown-content">
          {searchBarComp}
          {selectionBarComp}
          <ScrollableArea className="dropdown-options">
            {this.props.tags ? <div className="tags-container">{searchingOrItems}</div> : searchingOrItems}
          </ScrollableArea>
        </div>
      </WithPopover>
    );
  }
}
