// FontAwesome icon registration — import this once (side-effect only) from the
// root layout, per Code_Structure_Rules_Next convention (libs/icons.ts).
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBars,
  faChevronLeft,
  faChevronDown,
  faMagnifyingGlass,
  faXmark,
  faSun,
  faMoon,
} from '@fortawesome/free-solid-svg-icons';

library.add(faBars, faChevronLeft, faChevronDown, faMagnifyingGlass, faXmark, faSun, faMoon);
