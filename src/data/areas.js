export const AREAS = {
  NEGOCIO: {
    id: "NEGOCIO",
    label: "Negocio Principal",
    minMinutes: 300,
    color: "blue",
  },
  SEGUNDA: {
    id: "SEGUNDA",
    label: "Segunda Empresa",
    minMinutes: 60,
    color: "purple",
  },
  ESTUDIO: {
    id: "ESTUDIO",
    label: "Estudio Individual",
    minMinutes: 180,
    color: "yellow",
  },
  EJERCICIO: {
    id: "EJERCICIO",
    label: "Ejercicio",
    minMinutes: 30,
    color: "green",
  },
  OTROS: {
    id: "OTROS",
    label: "Otros",
    minMinutes: 0,
    color: "gray",
  },
  PERSONAL: {
    id: "PERSONAL",
    label: "Personal",
    minMinutes: 0,
    color: "pink",
  },
};

export const MANDATORY_AREAS = ["NEGOCIO", "SEGUNDA", "ESTUDIO", "EJERCICIO"];
