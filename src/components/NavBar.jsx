import { Navbar } from 'flowbite-react';
import { Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Inicio', path: '/' },
  { name: 'Acerca del blog', path: '/#acerca' }
];

function NavBar() {
  const location = useLocation();

  return (
    <Navbar
      fluid
      rounded
      className="border-b border-slate-200 bg-white/90 py-3 shadow-sm backdrop-blur"
    >
      <Navbar.Brand as={Link} to="/">
        <span className="self-center whitespace-nowrap text-xl font-semibold text-slate-900">
          React Tailwind Blog
        </span>
      </Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse>
        {navigation.map((item) => (
          <Navbar.Link
            key={item.name}
            as={Link}
            to={item.path}
            active={location.pathname === item.path}
          >
            {item.name}
          </Navbar.Link>
        ))}
        <Navbar.Link
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default NavBar;
