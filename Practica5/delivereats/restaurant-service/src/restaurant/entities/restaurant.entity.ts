import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { MenuItem } from './menu-item.entity';

@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  category: string;

  @Column()
  horario: string;

  @Column({ default: '0' })
  calificacion: string;

  // Campos para filtros de búsqueda
  @Column({ type: 'float', default: 0 })
  avgRating: number;

  @Column({ type: 'int', default: 0 })
  totalSales: number;

  @Column({ default: false })
  hasActivePromotion: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => MenuItem, (menuItem) => menuItem.restaurant)
  menu: MenuItem[];
}