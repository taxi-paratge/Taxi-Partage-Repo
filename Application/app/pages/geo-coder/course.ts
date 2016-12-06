/**
 * @summary Cette classe est utilisée par l'API Geo Coder qui permet de prendre une adresse et de la transformer en latitude et longitude.
 *
 * @author Equipe Whos.
 */

import { Usager } from './usager';

export class Course{
  constructor(time,user)
  {
  	this.date_heure_demande=time;
  	this.usagers = user;

  }
  private date_heure_demande: string;
  private usagers: any;
}
