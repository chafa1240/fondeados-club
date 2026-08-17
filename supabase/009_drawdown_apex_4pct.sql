-- Fondeados Club — migración 009 (2026-08-17)
--
-- Corrige un dato mal asumido en la 008. Ahí, al recuperar las cuentas que
-- estaban cargadas con drawdown en 0%, se les puso 5% / $2.500 dando por
-- sentado que ese era el drawdown de una Apex de 50k. Es 4% / $2.000.
--
-- Verificado en la documentación de Apex (2026-08-17):
--   https://apextraderfunding.com/help-center/intraday-trailing-drawdown-accounts/intraday-trailing-drawdown-explained/
--
--   $25.000  → $1.000     $100.000 → $3.000
--   $50.000  → $2.000     $150.000 → $4.000
--
-- Ojo: el drawdown de Apex NO es un % fijo del tamaño de cuenta (4% en
-- 50k, 3% en 100k, 2,67% en 150k). Por eso el dato que manda es el monto
-- en dólares, y el % es solo una forma de mostrarlo.
--
-- El `piso_congelado` que dejó la 008 (tamaño + 100) sí estaba bien: el
-- trailing de una Performance Account frena en Starting Balance + $100.
-- Lo que cambia es cuándo llega ahí: con $2.000 de drawdown, una 50k se
-- congela al tocar 52.100 (no 52.600).
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

-- Solo las filas que tocó la 008: fondeadas que quedaron justo en 5% y con
-- el piso congelado que puso esa migración. Una cuenta con 5% cargado a
-- mano y sin piso congelado no se toca.
update public.cuentas_fondeo
   set drawdown_maximo_pct = 4,
       drawdown_maximo_monto = tamano_cuenta * 0.04
 where tipo = 'fondeada'
   and drawdown_maximo_pct = 5
   and piso_congelado = tamano_cuenta + 100;

notify pgrst, 'reload schema';
